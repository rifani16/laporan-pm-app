/**
 * Auth.gs
 * Modul autentikasi dan manajemen akun (Super Admin & Admin Daerah).
 */

const INVALID_CREDENTIALS_MESSAGE = 'Username atau password salah';
// Format lama: "salt:hashHex" (1x SHA-256). Format baru: "v2$iterasi$salt$hashHex".
const LEGACY_HASH_FORMAT = /^[0-9a-f]{16}:[0-9a-f]{64}$/;
const V2_HASH_FORMAT = /^v2\$\d{1,6}\$[0-9a-f]{16}\$[0-9a-f]{64}$/;
// Ukur dulu dengan benchmarkPasswordHash(); naikkan bila login masih cepat.
const PASSWORD_ITERATIONS = 1000;

/**
 * Dispatcher untuk aksi autentikasi
 */
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

/**
 * Fungsi verifikasi dan autentikasi user
 * Mendukung password yang di-hash (salt:hashHex) maupun plain text (akan otomatis di-upgrade ke hash)
 */
function authenticateUser(data) {
  const username = String(data.username || '').trim();
  const password = String(data.password || '');

  if (!username || !password) {
    throw new Error('Username dan password wajib diisi');
  }

  assertLoginAllowed(username);

  const sheetName = (typeof SHEET_NAMES !== 'undefined' && SHEET_NAMES.USERS) ? SHEET_NAMES.USERS : 'Users';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Sheet '${sheetName}' tidak ditemukan. Pastikan sheet akun sudah dibuat.`);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    throw new Error('Data pengguna di sheet Users masih kosong');
  }

  const headers = values[0].map(h => String(h).trim().toLowerCase());
  
  // Deteksi indeks kolom secara fleksibel
  const colUsername = findHeaderIndex(headers, ['username', 'user', 'nama_user', 'id_user']);
  const colPassword = findHeaderIndex(headers, ['password', 'pass', 'password_hash', 'pwd']);
  const colNama = findHeaderIndex(headers, ['nama', 'name', 'nama_lengkap', 'display_name']);
  const colRole = findHeaderIndex(headers, ['role', 'peran', 'level', 'tipe_akses']);
  const colDaerah = findHeaderIndex(headers, ['daerah', 'region', 'wilayah', 'cabang']);
  const colStatus = findHeaderIndex(headers, ['status', 'status_aktif', 'is_active', 'state']);

  if (colUsername === -1 || colPassword === -1) {
    throw new Error('Header kolom "username" atau "password" tidak ditemukan di sheet Users');
  }

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowUsername = String(row[colUsername] || '').trim();

    // Cocokkan username (case-insensitive)
    if (rowUsername.toLowerCase() === username.toLowerCase()) {
      const storedPassword = String(row[colPassword] || '');
      let isMatch = false;

      // Cek apakah password tersimpan dalam format hash (salt:hashHex).
      // Cek format ketat agar password plain text yang mengandung ':' tidak salah dikira hash.
      if (isHashedPassword(storedPassword)) {
        isMatch = verifyPassword(password, storedPassword);
        if (isMatch && needsRehash(storedPassword)) {
          sheet.getRange(i + 1, colPassword + 1).setValue(hashPassword(password));
        }
      } else {
        // Fallback untuk plain text (kemudian auto-upgrade ke hash demi keamanan)
        isMatch = (storedPassword === password);
        if (isMatch) {
          const newHashedPassword = hashPassword(password);
          sheet.getRange(i + 1, colPassword + 1).setValue(newHashedPassword);
        }
      }

      if (!isMatch) {
        recordLoginFailure(username);
        throw new Error(INVALID_CREDENTIALS_MESSAGE);
      }

      // Status dicek setelah password benar agar tidak membocorkan keberadaan akun
      if (colStatus !== -1) {
        const status = String(row[colStatus] || '').trim().toLowerCase();
        if (status && status !== 'active' && status !== 'aktif' && status !== '1' && status !== 'true') {
          throw new Error('Akun Anda sedang dinonaktifkan. Silakan hubungi Super Admin.');
        }
      }

      clearLoginFailures(username);

      const role = colRole !== -1 ? String(row[colRole] || 'admin_daerah').trim() : 'admin_daerah';
      const daerah = colDaerah !== -1 ? String(row[colDaerah] || '').trim() : '';
      const nama = colNama !== -1 ? String(row[colNama] || rowUsername).trim() : rowUsername;

      return {
        username: rowUsername,
        nama: nama,
        role: role,
        daerah: daerah
      };
    }
  }

  recordLoginFailure(username);
  throw new Error(INVALID_CREDENTIALS_MESSAGE);
}

/**
 * Ganti password user
 */
function changeUserPassword(data) {
  const username = String(data.username || '').trim();
  const oldPassword = String(data.oldPassword || '');
  const newPassword = String(data.newPassword || '');

  if (!username || !oldPassword || !newPassword) {
    throw new Error('Data perubahan password tidak lengkap');
  }

  if (newPassword.length < 6) {
    throw new Error('Password baru minimal 6 karakter');
  }

  // Verifikasi user terlebih dahulu
  authenticateUser({ username, password: oldPassword });

  const sheetName = (typeof SHEET_NAMES !== 'undefined' && SHEET_NAMES.USERS) ? SHEET_NAMES.USERS : 'Users';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim().toLowerCase());
  
  const colUsername = findHeaderIndex(headers, ['username', 'user']);
  const colPassword = findHeaderIndex(headers, ['password', 'pass', 'password_hash']);

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][colUsername]).trim().toLowerCase() === username.toLowerCase()) {
      const newHash = hashPassword(newPassword);
      sheet.getRange(i + 1, colPassword + 1).setValue(newHash);
      return;
    }
  }
  throw new Error('User tidak ditemukan');
}

/**
 * Helper untuk mencocokkan nama header dengan variasi alias
 */
function findHeaderIndex(headers, possibleNames) {
  for (const name of possibleNames) {
    const idx = headers.indexOf(name);
    if (idx !== -1) return idx;
  }
  return -1;
}

function isHashedPassword(value) {
  return LEGACY_HASH_FORMAT.test(value) || V2_HASH_FORMAT.test(value);
}

function needsRehash(storedHash) {
  if (!V2_HASH_FORMAT.test(storedHash)) return true;
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

/**
 * Verifikasi password mentah terhadap hash format lama maupun v2.
 */
function verifyPassword(inputPassword, storedHash) {
  let salt, iterations, originalHash;
  if (V2_HASH_FORMAT.test(storedHash || '')) {
    const parts = storedHash.split('$');
    iterations = Number(parts[1]);
    salt = parts[2];
    originalHash = parts[3];
  } else if (LEGACY_HASH_FORMAT.test(storedHash || '')) {
    iterations = 1;
    [salt, originalHash] = storedHash.split(':');
  } else {
    return false;
  }
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

/**
 * Custom Formula Google Sheets untuk membuat hash password langsung di sel:
 * Contoh penggunaan di sel: =HASH_PW("Password123")
 * @customfunction
 */
function HASH_PW(password) {
  if (!password) return '';
  return hashPassword(String(password));
}

