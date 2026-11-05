const USER_ROLES = ['super_admin', 'admin_daerah'];
const USERNAME_FORMAT = /^[A-Za-z0-9_.-]{3,30}$/;

function handleUserAction(action, data) {
  if (action === 'TAMBAH_AKUN') {
    withScriptLock(() => addUser(data));
    return successResponse('Akun berhasil ditambahkan');
  }
  if (action === 'EDIT_AKUN') {
    editUser(data);
    return successResponse('Akun berhasil diperbarui');
  }
  if (action === 'STATUS_AKUN') {
    const aktif = setUserStatus(data);
    return successResponse(aktif ? 'Akun diaktifkan' : 'Akun dinonaktifkan');
  }
  if (action === 'RESET_PASSWORD_AKUN') {
    const user = requireUser(data.username);
    validateNewPassword(data.newPassword);
    user.set('password', hashPassword(String(data.newPassword)));
    return successResponse('Password berhasil direset');
  }
  return null;
}

// Hash password tidak pernah ikut dikirim ke browser.
function listUsers() {
  const { headers, rows } = getUsersSheet();
  const cell = (row, name) => (headers.indexOf(name) === -1 ? '' : row[headers.indexOf(name)]);
  return rows
    .filter(row => String(cell(row, 'username')).trim())
    .map(row => ({
      id: cell(row, 'id'),
      username: String(cell(row, 'username')).trim(),
      nama: String(cell(row, 'nama')).trim(),
      role: String(cell(row, 'role') || 'admin_daerah').trim(),
      daerah: String(cell(row, 'daerah')).trim(),
      aktif: isActiveStatus(cell(row, 'status'))
    }));
}

function requireUser(username) {
  const user = findUser(username);
  if (!user) throw new Error('Akun tidak ditemukan');
  return user;
}

function isSameUser(user, username) {
  return String(user.get('username')).trim().toLowerCase() === String(username || '').toLowerCase();
}

function validateUserProfile(data) {
  const role = String(data.role || '');
  if (!USER_ROLES.includes(role)) throw new Error('Role tidak valid');
  const daerah = role === 'super_admin' ? '' : String(data.daerah || '').trim();
  if (role === 'admin_daerah' && !getRefData().daerah.map(String).includes(daerah)) {
    throw new Error('Pilih daerah yang terdaftar');
  }
  return { nama: String(data.nama || '').trim(), role, daerah };
}

function addUser(data) {
  const username = String(data.username || '').trim();
  if (!USERNAME_FORMAT.test(username)) {
    throw new Error('Username 3-30 karakter: huruf, angka, titik, garis bawah, atau strip');
  }
  if (findUser(username)) throw new Error('Username sudah dipakai');
  validateNewPassword(data.password);
  const profile = validateUserProfile(data);

  const { sheet, headers, rows } = getUsersSheet();
  const idColumn = headers.indexOf('id');
  const ids = rows.map(row => Number(row[idColumn])).filter(Number.isFinite);
  const values = {
    id: Math.max(0, ...ids) + 1,
    username,
    password: hashPassword(String(data.password)),
    ...profile,
    status: 'aktif'
  };
  sheet.appendRow(headers.map(header => values[header] ?? ''));
}

function editUser(data) {
  const user = requireUser(data.username);
  const profile = validateUserProfile(data);
  if (isSameUser(user, data.actor) && profile.role !== String(user.get('role')).trim()) {
    throw new Error('Role akun sendiri tidak bisa diubah');
  }
  for (const [field, value] of Object.entries(profile)) user.set(field, value);
}

function setUserStatus(data) {
  const user = requireUser(data.username);
  const aktif = data.aktif === true || data.aktif === 'true';
  if (!aktif && isSameUser(user, data.actor)) {
    throw new Error('Akun sendiri tidak bisa dinonaktifkan');
  }
  user.set('status', aktif ? 'aktif' : 'nonaktif');
  return aktif;
}
