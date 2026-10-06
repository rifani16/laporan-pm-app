/* eslint-disable no-undef */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from '../api/index.js';

const ORIGIN = 'https://laporan-pm-app.vercel.app';
const GAS_URL = 'https://script.google.com/macros/s/TEST/exec';

function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) { res.headers[k] = v; },
    status(code) { res.statusCode = code; return res; },
    json(payload) { res.body = payload; return res; },
    end() { return res; },
  };
  return res;
}

const makeReq = (overrides = {}) => ({
  method: 'POST',
  headers: { origin: ORIGIN, 'x-session-token': 'tok123' },
  body: { action: 'EDIT_MASTER', data: { 'ID PM': 'KS-2026-00001' } },
  ...overrides,
});

const okResponse = (body = { success: true }) => ({ status: 200, json: async () => body });

describe('api proxy', () => {
  beforeEach(() => {
    process.env.GAS_URL = GAS_URL;
    process.env.GAS_API_KEY = 'secret-key';
    delete process.env.ALLOWED_ORIGINS;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse()));
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rejects POST without an allowed origin', async () => {
    const res = makeRes();
    await handler(makeReq({ headers: {} }), res);
    expect(res.statusCode).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects an origin that is not allowed', async () => {
    const res = makeRes();
    await handler(makeReq({ headers: { origin: 'https://evil.example' } }), res);
    expect(res.statusCode).toBe(403);
  });

  it('rejects methods other than GET and POST', async () => {
    const res = makeRes();
    await handler(makeReq({ method: 'DELETE' }), res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 500 when GAS_API_KEY is missing', async () => {
    delete process.env.GAS_API_KEY;
    const res = makeRes();
    await handler(makeReq(), res);
    expect(res.statusCode).toBe(500);
  });

  it('rejects an invalid body', async () => {
    const res = makeRes();
    await handler(makeReq({ body: { action: 'X' } }), res);
    expect(res.statusCode).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('injects api key and session token into the forwarded POST body', async () => {
    const res = makeRes();
    await handler(makeReq({ body: { action: 'A', data: { x: 1 }, api_key: 'forged', session_token: 'forged' } }), res);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe(GAS_URL);
    expect(JSON.parse(options.body)).toEqual({
      action: 'A',
      data: { x: 1 },
      api_key: 'secret-key',
      session_token: 'tok123',
    });
  });

  it('forwards GET with key and token as query params', async () => {
    const res = makeRes();
    await handler(makeReq({ method: 'GET', body: undefined }), res);
    const [url] = fetch.mock.calls[0];
    expect(url).toBe(`${GAS_URL}?api_key=secret-key&token=tok123`);
  });

  it('retries GET once, then succeeds', async () => {
    fetch.mockRejectedValueOnce(Object.assign(new Error('abort'), { name: 'AbortError' }));
    const res = makeRes();
    await handler(makeReq({ method: 'GET', body: undefined }), res);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(res.statusCode).toBe(200);
  });

  it('does not retry POST and hides the internal error message', async () => {
    fetch.mockRejectedValue(new Error('internal detail'));
    const res = makeRes();
    await handler(makeReq(), res);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('internal detail');
  });

  it('returns 504 when GET times out twice', async () => {
    fetch.mockRejectedValue(Object.assign(new Error('abort'), { name: 'AbortError' }));
    const res = makeRes();
    await handler(makeReq({ method: 'GET', body: undefined }), res);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(res.statusCode).toBe(504);
  });

  it('honors ALLOWED_ORIGINS from env', async () => {
    process.env.ALLOWED_ORIGINS = 'https://other.example';
    const res = makeRes();
    await handler(makeReq(), res);
    expect(res.statusCode).toBe(403);
  });
});
