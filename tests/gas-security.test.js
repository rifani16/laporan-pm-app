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
let usersSheet = [];
const SpreadsheetApp = {
  getActiveSpreadsheet: () => ({
    getSheetByName: () => ({
      getDataRange: () => ({ getValues: () => usersSheet }),
      getRange: (row, column) => ({ setValue: v => { usersSheet[row - 1][column - 1] = v; } })
    })
  })
};
const context = vm.createContext({ Utilities, CacheService, SpreadsheetApp, SHEET_NAMES: { USERS: 'Users' } });
for (const file of ['Security.gs', 'Auth.gs']) {
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
    usersSheet = [header, [1, 'KSBL5', context.hashPassword('benar123'), 'Admin BL', 'admin_daerah', 'Bandar Lampung', 'aktif']];
    expect(login('ksbl5', 'benar123')).toEqual({ username: 'KSBL5', nama: 'Admin BL', role: 'admin_daerah', daerah: 'Bandar Lampung' });
    expect(() => login('KSBL5', 'salah')).toThrow('Username atau password salah');
    expect(() => login('TIDAKADA', 'benar123')).toThrow('Username atau password salah');
  });

  it('blocks inactive accounts', () => {
    cache.clear();
    usersSheet = [header, [1, 'KSBL5', context.hashPassword('benar123'), '', '', '', 'nonaktif']];
    expect(() => login('KSBL5', 'benar123')).toThrow('dinonaktifkan');
  });
});
