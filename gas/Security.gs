function checkApiKey(providedKey) {
  const apiKey = getApiKey();
  if (!apiKey) return false;
  return String(providedKey || '') === apiKey;
}

// Password tidak pernah ditulis ke sel sebagai teks, jangan diubah.
const UNSANITIZED_KEYS = ['password', 'oldPassword', 'newPassword'];

// Awalan formula (= + - @) diberi apostrof, kecuali angka/nomor telepon murni.
function isUnsafeCellText(value) {
  if (!/^\s*[=+\-@]/.test(value)) return false;
  return !/^\s*[+-]?[\d\s().-]+$/.test(value);
}

function sanitizeObject(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    // "__proto__" dari JSON.parse akan mengganti prototype result dan melewati sanitasi.
    if (key === '__proto__') continue;
    if (value !== null && typeof value === 'object') {
      throw new Error('Format data tidak valid');
    }
    if (UNSANITIZED_KEYS.includes(key)) {
      result[key] = value;
    } else if (typeof value === 'string') {
      result[key] = isUnsafeCellText(value) ? "'" + value : value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

const SESSION_TTL_SECONDS = 6 * 60 * 60;
const MAX_LOGIN_FAILURES = 5;
const LOGIN_LOCK_SECONDS = 15 * 60;

function createSession(user) {
  const token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  CacheService.getScriptCache().put('sess_' + token, JSON.stringify(user), SESSION_TTL_SECONDS);
  return token;
}

function getSession(token) {
  if (!token) return null;
  const cached = CacheService.getScriptCache().get('sess_' + token);
  return cached ? JSON.parse(cached) : null;
}

function destroySession(token) {
  if (token) CacheService.getScriptCache().remove('sess_' + token);
}

function loginFailureKey(username) {
  return 'fail_' + String(username).toLowerCase();
}

function assertLoginAllowed(username) {
  const count = Number(CacheService.getScriptCache().get(loginFailureKey(username)) || 0);
  if (count >= MAX_LOGIN_FAILURES) {
    throw new Error('Terlalu banyak percobaan login. Coba lagi dalam 15 menit.');
  }
}

function recordLoginFailure(username) {
  const cache = CacheService.getScriptCache();
  const key = loginFailureKey(username);
  cache.put(key, String(Number(cache.get(key) || 0) + 1), LOGIN_LOCK_SECONDS);
}

function clearLoginFailures(username) {
  CacheService.getScriptCache().remove(loginFailureKey(username));
}
