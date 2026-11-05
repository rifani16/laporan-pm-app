import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import vm from 'node:vm';

// Stub Utilities Apps Script: computeDigest mengembalikan byte bertanda (-128..127).
const Utilities = {
  DigestAlgorithm: { SHA_256: 'sha256' },
  Charset: { UTF_8: 'utf8' },
  computeDigest: (_alg, text) => [...createHash('sha256').update(text, 'utf8').digest()].map(b => (b > 127 ? b - 256 : b)),
  getUuid: () => randomUUID()
};
const cache = new Map();
const CacheService = {
  getScriptCache: () => ({
    get: k => cache.get(k) ?? null,
    put: (k, v) => cache.set(k, v),
    remove: k => cache.delete(k)
  })
};
// Stub sheet: tiap sheet berupa array baris (baris 0 = header), indeks 1-based seperti Apps Script.
const REF_SHEET = [['Asnaf', 'Program', 'Daerah'], ['Fakir', 'Beasiswa', 'Bandar Lampung'], ['Miskin', 'Sembako', 'Metro']];
const sheets = { Users: [], MASTER_PM: [], REF: REF_SHEET };
const makeSheet = (name) => {
  const rows = () => sheets[name];
  const rowAt = index => (rows()[index] ||= []);
  return {
    getDataRange: () => ({ getValues: () => rows().map(row => [...row]) }),
    getLastRow: () => rows().length,
    getLastColumn: () => (rows().length ? rows()[0].length : 0),
    getRange: (row, column, numRows = 1, numColumns = 1) => ({
      getValues: () => rows().slice(row - 1, row - 1 + numRows).map(r => r.slice(column - 1, column - 1 + numColumns)),
      setValue: v => { rowAt(row - 1)[column - 1] = v; },
      setValues: values => values.forEach((r, i) => r.forEach((v, j) => { rowAt(row - 1 + i)[column - 1 + j] = v; }))
    }),
    appendRow: row => rows().push(row),
    deleteRow: row => rows().splice(row - 1, 1)
  };
};
const SpreadsheetApp = {
  getActiveSpreadsheet: () => ({
    getSheetByName: name => (sheets[name] ? makeSheet(name) : null),
    insertSheet: name => { sheets[name] = []; return makeSheet(name); }
  })
};
const LockService = { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) };
// formatDate disederhanakan: zona waktu UTC, cukup untuk pola yang dipakai di SheetData.gs.
Utilities.formatDate = (date, _tz, pattern) => {
  const iso = date.toISOString();
  return { 'HH:mm': iso.slice(11, 16), 'yyyy-MM-dd': iso.slice(0, 10), 'yyyy-MM-dd HH:mm': `${iso.slice(0, 10)} ${iso.slice(11, 16)}` }[pattern];
};
const context = vm.createContext({
  Utilities,
  CacheService,
  SpreadsheetApp,
  LockService,
  Session: { getScriptTimeZone: () => 'UTC' },
  SHEET_NAMES: { USERS: 'Users', MASTER: 'MASTER_PM', SALUR: 'SALUR', REF: 'REF', KEGIATAN: 'KEGIATAN' },
  invalidateMasterCache: () => {},
  getApiKey: () => 'KEY',
  // Responses.gs membungkus JSON di ContentService; stub ini mengembalikan objeknya langsung.
  ContentService: { createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }), MimeType: { JSON: 'json' } }
});
const GAS_FILES = ['SheetData.gs', 'Security.gs', 'Auth.gs', 'UserManagement.gs', 'MasterPm.gs', 'ProgramManagement.gs', 'Kegiatan.gs', 'Penyaluran.gs', 'ApiHandlers.gs', 'Responses.gs'];
for (const file of GAS_FILES) {
  vm.runInContext(readFileSync(new URL(`../gas/${file}`, import.meta.url), 'utf8'), context);
}
const sanitize = (json) => vm.runInContext(`sanitizeObject(JSON.parse(${JSON.stringify(json)}))`, context);

describe('sanitizeObject', () => {
  it('prefixes formula text with an apostrophe', () => {
    expect(sanitize('{"CATATAN":"=1+1"}').CATATAN).toBe("'=1+1");
  });

  it('keeps phone numbers and passwords as-is', () => {
    const result = sanitize('{"NO HP":"+62 812","password":"=secret"}');
    expect(result['NO HP']).toBe('+62 812');
    expect(result.password).toBe('=secret');
  });

  it('ignores __proto__ so formulas cannot be smuggled through the prototype', () => {
    const result = sanitize('{"NAMA PM":"x","__proto__":{"CATATAN":"=TEXTJOIN(\\"|\\",TRUE,Users!A1:H300)"}}');
    expect(result.CATATAN).toBeUndefined();
    expect(Object.keys(result)).toEqual(['NAMA PM']);
  });

  it('rejects nested values', () => {
    expect(() => sanitize('{"CATATAN":{"x":"=1"}}')).toThrow('Format data tidak valid');
    expect(() => sanitize('{"CATATAN":["=1"]}')).toThrow('Format data tidak valid');
  });
});

describe('password hashing', () => {
  const { hashPassword, verifyPassword } = context;

  it('verifies the right password and rejects a wrong one', () => {
    const stored = hashPassword('rahasia123');
    expect(stored).toMatch(/^v2\$1000\$[0-9a-f]{16}\$[0-9a-f]{64}$/);
    expect(verifyPassword('rahasia123', stored)).toBe(true);
    expect(verifyPassword('rahasia124', stored)).toBe(false);
  });

  it('rejects plain text and the legacy salt:hash format', () => {
    expect(verifyPassword('rahasia123', 'rahasia123')).toBe(false);
    expect(verifyPassword('x', `${'a'.repeat(16)}:${'b'.repeat(64)}`)).toBe(false);
  });
});

describe('authenticateUser', () => {
  const header = ['id', 'username', 'password', 'nama', 'role', 'daerah', 'status'];
  const login = (username, password) => context.authenticateUser({ username, password });

  it('logs in with the sheet columns and rejects a bad password', () => {
    cache.clear();
    sheets.Users = [header, [1, 'KSBL5', context.hashPassword('benar123'), 'Admin BL', 'admin_daerah', 'Bandar Lampung', 'aktif']];
    expect(login('ksbl5', 'benar123')).toEqual({ username: 'KSBL5', nama: 'Admin BL', role: 'admin_daerah', daerah: 'Bandar Lampung' });
    expect(() => login('KSBL5', 'salah')).toThrow('Username atau password salah');
    expect(() => login('TIDAKADA', 'benar123')).toThrow('Username atau password salah');
  });

  it('blocks inactive accounts', () => {
    cache.clear();
    sheets.Users = [header, [1, 'KSBL5', context.hashPassword('benar123'), '', '', '', 'nonaktif']];
    expect(() => login('KSBL5', 'benar123')).toThrow('dinonaktifkan');
  });
});

describe('user management', () => {
  const header = ['id', 'username', 'password', 'nama', 'role', 'daerah', 'status'];
  const act = (action, data) => context.handleUserAction(action, { actor: 'ADMIN', ...data });

  const reset = () => {
    cache.clear();
    sheets.Users = [
      header,
      [1, 'ADMIN', context.hashPassword('admin123'), 'Admin', 'super_admin', '', 'aktif'],
      [7, 'KSBL5', context.hashPassword('benar123'), 'Admin BL', 'admin_daerah', 'Bandar Lampung', 'aktif']
    ];
  };

  it('lists users without password hashes', () => {
    reset();
    const users = context.listUsers();
    expect(users.map(u => u.username)).toEqual(['ADMIN', 'KSBL5']);
    expect(JSON.stringify(users)).not.toContain('v2$');
  });

  it('adds a user with a hashed password and the next id', () => {
    reset();
    act('TAMBAH_AKUN', { username: 'KSMT5', password: 'awal1234', nama: 'Admin Metro', role: 'admin_daerah', daerah: 'Metro' });
    const row = sheets.Users[3];
    expect(row[0]).toBe(8);
    expect(row[2]).toMatch(/^v2\$/);
    expect(row.slice(3)).toEqual(['Admin Metro', 'admin_daerah', 'Metro', 'aktif']);
    expect(context.authenticateUser({ username: 'KSMT5', password: 'awal1234' }).daerah).toBe('Metro');
  });

  it('rejects duplicate usernames, unknown daerah, and short passwords', () => {
    reset();
    const base = { username: 'BARU1', password: 'awal1234', role: 'admin_daerah', daerah: 'Metro' };
    expect(() => act('TAMBAH_AKUN', { ...base, username: 'ksbl5' })).toThrow('sudah dipakai');
    expect(() => act('TAMBAH_AKUN', { ...base, daerah: 'Tidak Ada' })).toThrow('daerah');
    expect(() => act('TAMBAH_AKUN', { ...base, password: '123' })).toThrow('minimal');
  });

  it('protects the acting super admin from locking themselves out', () => {
    reset();
    expect(() => act('EDIT_AKUN', { username: 'ADMIN', role: 'admin_daerah', daerah: 'Metro' })).toThrow('Role akun sendiri');
    expect(() => act('STATUS_AKUN', { username: 'ADMIN', aktif: false })).toThrow('Akun sendiri');
  });

  it('ends the session of a deactivated user and applies role changes immediately', () => {
    reset();
    const token = context.createSession({ username: 'KSBL5', role: 'admin_daerah', daerah: 'Bandar Lampung' });
    act('EDIT_AKUN', { username: 'KSBL5', nama: 'Admin BL', role: 'admin_daerah', daerah: 'Metro' });
    expect(context.getActiveSession(token).daerah).toBe('Metro');

    act('STATUS_AKUN', { username: 'KSBL5', aktif: false });
    expect(context.getActiveSession(token)).toBeNull();
    expect(() => context.authenticateUser({ username: 'KSBL5', password: 'benar123' })).toThrow('dinonaktifkan');
  });

  it('resets a password', () => {
    reset();
    act('RESET_PASSWORD_AKUN', { username: 'KSBL5', newPassword: 'baru5678' });
    expect(context.authenticateUser({ username: 'KSBL5', password: 'baru5678' }).username).toBe('KSBL5');
  });
});

describe('NIK uniqueness', () => {
  const header = ['ID PM', 'NAMA PM', 'NIK', 'NIK ALT', 'DAERAH'];
  const NIK_A = '1801010101010001';
  const NIK_B = '1801010101010002';
  const reset = () => {
    sheets.MASTER_PM = [header, ['KS-2026-00001', 'Budi', NIK_A, NIK_B, 'Metro']];
  };

  it('rejects a new PM whose NIK or NIK ALT is already used', () => {
    reset();
    expect(() => context.addMasterRecord({ 'NAMA PM': 'Andi', NIK: NIK_A })).toThrow(`NIK ${NIK_A} sudah terdaftar di ID PM KS-2026-00001 (daerah Metro)`);
    expect(() => context.addMasterRecord({ 'NAMA PM': 'Andi', NIK: NIK_B })).toThrow('sudah terdaftar');
    expect(sheets.MASTER_PM).toHaveLength(2);
  });

  it('accepts a new NIK and rejects NIK equal to NIK ALT', () => {
    reset();
    expect(context.addMasterRecord({ 'NAMA PM': 'Andi', NIK: '1801010101010003' })).toBe('KS-2026-00002');
    expect(() => context.addMasterRecord({ 'NAMA PM': 'Cici', NIK: '1801010101010009', 'NIK ALT': '1801010101010009' })).toThrow('tidak boleh sama');
  });

  it('lets a PM keep its own NIK on edit but not take another PM\'s NIK', () => {
    reset();
    sheets.MASTER_PM.push(['KS-2026-00002', 'Andi', '1801010101010003', '', 'Metro']);
    expect(() => context.editMasterRow({ 'ID PM': 'KS-2026-00001', 'NAMA PM': 'Budi S', NIK: NIK_A })).not.toThrow();
    expect(sheets.MASTER_PM[1][1]).toBe('Budi S');
    expect(() => context.editMasterRow({ 'ID PM': 'KS-2026-00002', NIK: NIK_A })).toThrow('sudah terdaftar');
  });

  it('does not block editing other fields when an old duplicate exists', () => {
    reset();
    sheets.MASTER_PM.push(['KS-2026-00002', 'Budi kembar', NIK_A, '', 'Metro']);
    expect(() => context.editMasterRow({ 'ID PM': 'KS-2026-00002', 'NAMA PM': 'Budi K', NIK: NIK_A })).not.toThrow();
  });
});

describe('kegiatan penyaluran', () => {
  const SALUR_HEADER = ['ID SALUR', 'ID PM', 'NAMA PENERIMA', 'DAERAH', 'PROGRAM', 'JUMLAH PENERIMAAN', 'KETERANGAN'];
  const kegiatanInput = { 'NAMA KEGIATAN': 'Beasiswa Ganjil', PROGRAM: 'Beasiswa', TANGGAL: '2026-11-05', ANGGARAN: '5000000', STATUS: 'Berjalan' };
  const col = (sheet, name) => sheets[sheet][0].indexOf(name);
  const cell = (sheet, row, name) => sheets[sheet][row][col(sheet, name)];

  const reset = () => {
    delete sheets.KEGIATAN;
    sheets.REF = REF_SHEET.map(row => [...row]);
    sheets.SALUR = [SALUR_HEADER, ['TX-2026-00001', 'KS-2026-00001', 'Budi', 'Metro', 'Sembako', 100000, 'lama']];
  };

  it('creates the KEGIATAN sheet on first add and numbers ids', () => {
    reset();
    expect(context.addKegiatan(kegiatanInput)).toBe('KG-00001');
    expect(context.addKegiatan({ ...kegiatanInput, 'NAMA KEGIATAN': 'Kedua' })).toBe('KG-00002');
    expect(sheets.KEGIATAN[0]).toEqual(['ID KEGIATAN', 'NAMA KEGIATAN', 'PROGRAM', 'TANGGAL', 'LOKASI', 'SUMBER DANA', 'ANGGARAN', 'PENANGGUNG JAWAB', 'STATUS', 'KETERANGAN']);
    expect(cell('KEGIATAN', 1, 'ANGGARAN')).toBe(5000000);
  });

  it('validates program, date, budget, and status', () => {
    reset();
    expect(() => context.addKegiatan({ ...kegiatanInput, PROGRAM: 'Tidak Ada' })).toThrow('program');
    expect(() => context.addKegiatan({ ...kegiatanInput, TANGGAL: '2026-02-30' })).toThrow('Tanggal');
    expect(() => context.addKegiatan({ ...kegiatanInput, ANGGARAN: '-1' })).toThrow('Anggaran');
    expect(() => context.addKegiatan({ ...kegiatanInput, STATUS: 'Batal' })).toThrow('Status');
    expect(() => context.addKegiatan({ ...kegiatanInput, 'NAMA KEGIATAN': ' ' })).toThrow('Nama kegiatan');
  });

  it('adds a transaction under a kegiatan with program and audit trail from the server', () => {
    reset();
    context.addKegiatan(kegiatanInput);
    const id = context.addSalurRecord({ 'ID PM': 'KS-2026-00002', 'ID KEGIATAN': 'KG-00001', PROGRAM: 'Sembako', 'JUMLAH PENERIMAAN': 250000, 'DIINPUT OLEH': 'palsu', actor: 'KSBL5' });
    expect(id).toBe('TX-2026-00002');
    expect(cell('SALUR', 2, 'PROGRAM')).toBe('Beasiswa');
    expect(cell('SALUR', 2, 'ID KEGIATAN')).toBe('KG-00001');
    expect(cell('SALUR', 2, 'DIINPUT OLEH')).toBe('KSBL5');
    expect(Object.prototype.toString.call(cell('SALUR', 2, 'DIINPUT PADA'))).toBe('[object Date]');
  });

  it('rejects transactions without a kegiatan or into a finished one', () => {
    reset();
    context.addKegiatan({ ...kegiatanInput, STATUS: 'Selesai' });
    expect(() => context.addSalurRecord({ 'ID PM': 'KS-2026-00002' })).toThrow('Pilih kegiatan');
    expect(() => context.addSalurRecord({ 'ID PM': 'KS-2026-00002', 'ID KEGIATAN': 'KG-00009' })).toThrow('terdaftar');
    expect(() => context.addSalurRecord({ 'ID PM': 'KS-2026-00002', 'ID KEGIATAN': 'KG-00001' })).toThrow('sudah selesai');
  });

  it('moves an old transaction into a kegiatan on edit and records who changed it', () => {
    reset();
    context.addKegiatan(kegiatanInput);
    context.editSalurRow({ 'ID SALUR': 'TX-2026-00001', 'ID KEGIATAN': 'KG-00001', actor: 'ADMIN' });
    expect(cell('SALUR', 1, 'PROGRAM')).toBe('Beasiswa');
    expect(cell('SALUR', 1, 'DIUBAH OLEH')).toBe('ADMIN');
    expect(() => context.editSalurRow({ 'ID SALUR': 'TX-2026-00001', 'ID KEGIATAN': '' })).toThrow('tidak bisa dilepas');
  });

  it('keeps a transaction editable after its kegiatan is finished', () => {
    reset();
    context.addKegiatan(kegiatanInput);
    context.addSalurRecord({ 'ID PM': 'KS-2026-00002', 'ID KEGIATAN': 'KG-00001', actor: 'KSBL5' });
    context.editKegiatan({ ...kegiatanInput, 'ID KEGIATAN': 'KG-00001', STATUS: 'Selesai' });
    expect(() => context.editSalurRow({ 'ID SALUR': 'TX-2026-00002', 'JUMLAH PENERIMAAN': 300000, actor: 'KSBL5' })).not.toThrow();
    expect(cell('SALUR', 2, 'JUMLAH PENERIMAAN')).toBe(300000);
  });

  it('blocks deleting or changing the program of a kegiatan that has transactions', () => {
    reset();
    context.addKegiatan(kegiatanInput);
    context.addSalurRecord({ 'ID PM': 'KS-2026-00002', 'ID KEGIATAN': 'KG-00001', actor: 'KSBL5' });
    expect(() => context.deleteKegiatan({ 'ID KEGIATAN': 'KG-00001' })).toThrow('masih punya 1 transaksi');
    expect(() => context.editKegiatan({ ...kegiatanInput, 'ID KEGIATAN': 'KG-00001', PROGRAM: 'Sembako' })).toThrow('Program tidak bisa diganti');
    context.addKegiatan({ ...kegiatanInput, 'NAMA KEGIATAN': 'Kosong' });
    context.deleteKegiatan({ 'ID KEGIATAN': 'KG-00002' });
    expect(sheets.KEGIATAN).toHaveLength(2);
  });

  it('lists kegiatan with realisasi and unique recipients', () => {
    reset();
    context.addKegiatan(kegiatanInput);
    context.addSalurRecord({ 'ID PM': 'KS-2026-00002', 'ID KEGIATAN': 'KG-00001', 'JUMLAH PENERIMAAN': 200000, actor: 'A' });
    context.addSalurRecord({ 'ID PM': 'KS-2026-00002', 'ID KEGIATAN': 'KG-00001', 'JUMLAH PENERIMAAN': 50000, actor: 'A' });
    const [kegiatan] = context.listKegiatan(context.getSheetData('SALUR'));
    expect(kegiatan.REALISASI).toBe(250000);
    expect(kegiatan['JUMLAH PENERIMA']).toBe(1);
  });

  it('renames the program inside kegiatan and blocks deleting a program in use', () => {
    reset();
    context.addKegiatan(kegiatanInput);
    context.editProgramRecord({ oldName: 'Beasiswa', newName: 'Beasiswa Pendidikan' });
    expect(cell('KEGIATAN', 1, 'PROGRAM')).toBe('Beasiswa Pendidikan');
    expect(() => context.deleteProgramRecord({ name: 'Beasiswa Pendidikan' })).toThrow('1 kegiatan');
  });

  it('sends date cells as plain text', () => {
    // Date dibuat di dalam sandbox supaya instanceof Date cocok, seperti di Apps Script.
    const format = iso => vm.runInContext(`formatCellValue(new Date('${iso}'))`, context);
    expect(format('2026-11-05T00:00:00Z')).toBe('2026-11-05');
    expect(format('2026-11-05T09:30:00Z')).toBe('2026-11-05 09:30');
    expect(context.formatCellValue('teks')).toBe('teks');
  });
});

describe('role access: only super admin writes, admin wilayah and daerah monitor', () => {
  const USERS_HEADER = ['id', 'username', 'password', 'nama', 'role', 'daerah', 'status'];
  const wilayah = { username: 'WIL1', role: 'admin_wilayah', daerah: '' };
  const daerahMetro = { username: 'KSMT5', role: 'admin_daerah', daerah: 'Metro' };
  const superAdmin = { username: 'ADMIN', role: 'super_admin', daerah: '' };
  const rows = [{ DAERAH: 'Metro' }, { DAERAH: 'Bandar Lampung' }];

  const post = (session, action, data) => {
    cache.clear();
    sheets.Users = [USERS_HEADER, [1, session.username, 'x', '', session.role, session.daerah, 'aktif']];
    const token = context.createSession(session);
    const body = JSON.stringify({ api_key: 'KEY', session_token: token, action, data });
    return context.handlePostRequest({ postData: { contents: body } });
  };

  it('sees every daerah while admin daerah sees only its own', () => {
    expect(context.filterByDaerah(rows, wilayah)).toHaveLength(2);
    expect(context.filterByDaerah(rows, daerahMetro)).toEqual([{ DAERAH: 'Metro' }]);
  });

  it('rejects every write from admin wilayah and admin daerah, including unknown actions', () => {
    const writes = ['TAMBAH_MASTER', 'EDIT_MASTER', 'HAPUS_MASTER', 'TAMBAH_SALUR', 'EDIT_SALUR', 'HAPUS_PM_PROGRAM',
      'TAMBAH_PROGRAM', 'TAMBAH_KEGIATAN', 'TAMBAH_AKUN', 'AKSI_BARU_NANTI'];
    for (const session of [wilayah, daerahMetro]) {
      for (const action of writes) expect(post(session, action, { x: 1 }).code).toBe(403);
    }
  });

  it('lets monitors log out and lets super admin write', () => {
    expect(post(daerahMetro, 'LOGOUT', {}).success).toBe(true);
    sheets.MASTER_PM = [['ID PM', 'NAMA PM', 'NIK', 'NIK ALT', 'DAERAH']];
    expect(post(superAdmin, 'TAMBAH_MASTER', { 'NAMA PM': 'Andi', DAERAH: 'Metro' }).success).toBe(true);
  });

  it('can be created by super admin without a daerah', () => {
    sheets.Users = [['id', 'username', 'password', 'nama', 'role', 'daerah', 'status']];
    context.handleUserAction('TAMBAH_AKUN', { actor: 'ADMIN', username: 'PANTAU', password: 'awal1234', role: 'admin_wilayah', daerah: 'Metro' });
    expect(sheets.Users[1].slice(3)).toEqual(['', 'admin_wilayah', '', 'aktif']);
  });
});
