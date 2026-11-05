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
const sheets = { Users: [], MASTER_PM: [] };
const makeSheet = (name) => {
  const rows = () => sheets[name];
  return {
    getDataRange: () => ({ getValues: () => rows().map(row => [...row]) }),
    getLastRow: () => rows().length,
    getLastColumn: () => rows()[0].length,
    getRange: (row, column, numRows = 1, numColumns = 1) => ({
      getValues: () => rows().slice(row - 1, row - 1 + numRows).map(r => r.slice(column - 1, column - 1 + numColumns)),
      setValue: v => { rows()[row - 1][column - 1] = v; },
      setValues: values => values.forEach((r, i) => r.forEach((v, j) => { rows()[row - 1 + i][column - 1 + j] = v; }))
    }),
    appendRow: row => rows().push(row)
  };
};
const SpreadsheetApp = {
  getActiveSpreadsheet: () => ({ getSheetByName: name => (sheets[name] ? makeSheet(name) : null) })
};
const LockService = { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) };
const context = vm.createContext({
  Utilities,
  CacheService,
  SpreadsheetApp,
  LockService,
  SHEET_NAMES: { USERS: 'Users', MASTER: 'MASTER_PM' },
  getRefData: () => ({ daerah: ['Bandar Lampung', 'Metro'] }),
  successResponse: message => ({ message })
});
for (const file of ['Security.gs', 'Auth.gs', 'UserManagement.gs', 'MasterPm.gs']) {
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
