import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyCaptchaToken } from './captcha';

describe('Cloudflare Turnstile CAPTCHA Verification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it('fails closed in Production when TURNSTILE_SECRET_KEY is missing', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    delete process.env.TURNSTILE_SECRET_KEY;

    const result = await verifyCaptchaToken('any-token');
    expect(result).toBe(false);
  });

  it('fails closed when token is missing or empty in Production', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-123';

    expect(await verifyCaptchaToken('')).toBe(false);
    expect(await verifyCaptchaToken(null)).toBe(false);
    expect(await verifyCaptchaToken(undefined)).toBe(false);
  });

  it('rejects verification when Cloudflare siteverify endpoint returns error', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-123';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['invalid-input-secret'] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await verifyCaptchaToken('invalid-token');
    expect(result).toBe(false);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('rejects expired or duplicate token', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-123';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['timeout-or-duplicate'] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await verifyCaptchaToken('expired-token');
    expect(result).toBe(false);
  });

  it('accepts verification when siteverify returns success and action matches', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-123';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: 'contact_form', hostname: 'everloft.co.in' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await verifyCaptchaToken('valid-token', {
      action: 'contact_form',
      expectedHostname: 'everloft.co.in',
    });
    expect(result).toBe(true);
  });

  it('rejects verification when action mismatches', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-123';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: 'different_action' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await verifyCaptchaToken('valid-token', { action: 'contact_form' });
    expect(result).toBe(false);
  });

  it('rejects verification when expected action is configured but action is missing from response', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-123';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }), // missing action field entirely
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await verifyCaptchaToken('valid-token', { action: 'contact_form' });
    expect(result).toBe(false);
  });

  it('rejects verification when hostname mismatches', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-123';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: 'contact_form', hostname: 'malicious-phishing.com' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await verifyCaptchaToken('valid-token', {
      action: 'contact_form',
      expectedHostname: 'everloft.co.in',
    });
    expect(result).toBe(false);
  });
});
