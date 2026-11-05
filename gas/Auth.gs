const INVALID_CREDENTIALS_MESSAGE = 'Username atau password salah';
// Format: "v2$iterasi$salt$hashHex". Password plain text di sheet tidak diterima.
const V2_HASH_FORMAT = /^v2\$\d{1,6}\$[0-9a-f]{16}\$[0-9a-f]{64}$/;
// Ukur dulu dengan benchmarkPasswordHash(); naikkan bila login masih cepat.
const PASSWORD_ITERATIONS = 1000;
const MIN_PASSWORD_LENGTH = 6;

function handleAuthAction(action, data) {
  if (action === 'LOGIN') {
    const result = authenticateUser(data);
    const token = createSession(result);
    return successResponse('Login berhasil', { user: result, token });
  }

  if (action === 'LOGOUT') {
    destroySession(data.session_token);
    return successResponse('Logout berhasil');
  }

  if (action === 'CHANGE_PASSWORD') {
    changeUserPassword(data);
    return successResponse('Password berhasil diperbarui');
  }

  return null;
}

function authenticateUser(data) {
  const username = String(data.username || '').trim();
  const password = String(data.password || '');

  if (!username || !password) {
    throw new Error('Username dan password wajib diisi');
  }

  assertLoginAllowed(username);

  const user = findUser(username);
  const storedPassword = String((user && user.get('password')) || '');
  if (!user || !verifyPassword(password, storedPassword)) {
    recordLoginFailure(username);
    throw new Error(INVALID_CREDENTIALS_MESSAGE);
  }
  if (needsRehash(storedPassword)) user.setPassword(hashPassword(password));

  // Status dicek setelah password benar agar tidak membocorkan keberadaan akun
  const status = String(user.get('status') || '').trim().toLowerCase();
  if (status && !['active', 'aktif', '1', 'true'].includes(status)) {
    throw new Error('Akun Anda sedang dinonaktifkan. Silakan hubungi Super Admin.');
  }

  clearLoginFailures(username);

  const rowUsername = String(user.get('username')).trim();
  return {
    username: rowUsername,
    nama: String(user.get('nama') || rowUsername).trim(),
    role: String(user.get('role') || 'admin_daerah').trim(),
    daerah: String(user.get('daerah') || '').trim()
  };
}

function changeUserPassword(data) {
  const username = String(data.username || '').trim();
  const oldPassword = String(data.oldPassword || '');
  const newPassword = String(data.newPassword || '');

  if (!username || !oldPassword || !newPassword) {
    throw new Error('Data perubahan password tidak lengkap');
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password baru minimal ${MIN_PASSWORD_LENGTH} karakter`);
  }

  authenticateUser({ username, password: oldPassword });
  findUser(username).setPassword(hashPassword(newPassword));
}

// Kolom sheet Users: id, username, password, nama, role, daerah, status.
function findUser(username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) throw new Error(`Sheet '${SHEET_NAMES.USERS}' tidak ditemukan.`);

  const [headers, ...rows] = sheet.getDataRange().getValues();
  const col = name => headers.indexOf(name);
  if (col('username') === -1 || col('password') === -1) {
    throw new Error('Kolom "username" atau "password" tidak ditemukan di sheet Users');
  }

  const target = username.toLowerCase();
  const index = rows.findIndex(row => String(row[col('username')] || '').trim().toLowerCase() === target);
  if (index === -1) return null;

  return {
    get: name => rows[index][col(name)],
    setPassword: hash => sheet.getRange(index + 2, col('password') + 1).setValue(hash)
  };
}

function needsRehash(storedHash) {
  return Number(storedHash.split('$')[1]) < PASSWORD_ITERATIONS;
}

function sha256Hex(text) {
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    text,
    Utilities.Charset.UTF_8
  );
  let hex = '';
  for (let i = 0; i < raw.length; i++) {
    const byteHex = (raw[i] < 0 ? raw[i] + 256 : raw[i]).toString(16);
    hex += byteHex.length === 1 ? '0' + byteHex : byteHex;
  }
  return hex;
}

function derivePasswordHash(password, salt, iterations) {
  let hex = sha256Hex(salt + password);
  for (let i = 1; i < iterations; i++) {
    hex = sha256Hex(hex + salt + password);
  }
  return hex;
}

/**
 * Hash password: SHA-256 berulang + salt acak.
 * @returns {string} Format: "v2$iterasi$salt$hashHex"
 */
function hashPassword(password, salt) {
  const useSalt = salt || Utilities.getUuid().replace(/-/g, '').substring(0, 16);
  const hash = derivePasswordHash(password, useSalt, PASSWORD_ITERATIONS);
  return 'v2$' + PASSWORD_ITERATIONS + '$' + useSalt + '$' + hash;
}

function verifyPassword(inputPassword, storedHash) {
  if (!V2_HASH_FORMAT.test(storedHash)) return false;
  const [, iterationText, salt, originalHash] = storedHash.split('$');
  const iterations = Number(iterationText);
  if (iterations < 1) return false;

  const computed = derivePasswordHash(inputPassword, salt, iterations);

  // Bandingkan seluruh karakter tanpa berhenti di selisih pertama.
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ originalHash.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Jalankan manual dari editor Apps Script (Run > benchmarkPasswordHash),
 * lalu lihat waktu di Execution log untuk memilih PASSWORD_ITERATIONS.
 */
function benchmarkPasswordHash() {
  [1, 500, 1000, 2000, 5000].forEach(n => {
    const start = Date.now();
    derivePasswordHash('benchmark', 'abcdef0123456789', n);
    console.log(n + ' iterasi: ' + (Date.now() - start) + ' ms');
  });
}


// Menu "Akun > Reset password" di Google Sheets. Password diketik di dialog, sel hanya berisi hash.
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Akun').addItem('Reset password', 'resetPasswordDialog').addToUi();
}

function resetPasswordDialog() {
  const ui = SpreadsheetApp.getUi();
  const userPrompt = ui.prompt('Reset password', 'Username:', ui.ButtonSet.OK_CANCEL);
  if (userPrompt.getSelectedButton() !== ui.Button.OK) return;
  const username = userPrompt.getResponseText().trim();
  const user = username && findUser(username);
  if (!user) return ui.alert(`User "${username}" tidak ditemukan.`);

  const passPrompt = ui.prompt(
    'Reset password',
    `Password baru untuk ${username} (minimal ${MIN_PASSWORD_LENGTH} karakter):`,
    ui.ButtonSet.OK_CANCEL
  );
  if (passPrompt.getSelectedButton() !== ui.Button.OK) return;
  const password = passPrompt.getResponseText();
  if (password.length < MIN_PASSWORD_LENGTH) {
    return ui.alert(`Password minimal ${MIN_PASSWORD_LENGTH} karakter. Belum ada yang diubah.`);
  }

  user.setPassword(hashPassword(password));
  ui.alert(`Password ${username} sudah diganti.`);
}
