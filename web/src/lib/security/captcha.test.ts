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

  it('rejects verification when outcome hostname is missing', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-123';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }), // missing hostname
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await verifyCaptchaToken('valid-token');
    expect(result).toBe(false);
  });

  it('rejects verification when outcome hostname is wrong/untrusted', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-123';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, hostname: 'evil-attacker.com' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await verifyCaptchaToken('valid-token');
    expect(result).toBe(false);
  });

  it('accepts verification for production hostname (www.everloft.co.in and everloft.co.in)', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-123';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, hostname: 'www.everloft.co.in' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await verifyCaptchaToken('valid-token');
    expect(result).toBe(true);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, hostname: 'everloft.co.in' }),
    });
    const result2 = await verifyCaptchaToken('valid-token');
    expect(result2).toBe(true);
  });

  it('accepts verification for exact Vercel Preview hostname from VERCEL_URL', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-123';
    process.env.VERCEL_URL = 'everloft-preview-git-fix-security.vercel.app';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, hostname: 'everloft-preview-git-fix-security.vercel.app' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await verifyCaptchaToken('valid-token');
    expect(result).toBe(true);
  });

  it('normalizes case, whitespace, and trailing dots in hostname validation', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-123';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, hostname: '  WWW.EVERLOFT.CO.IN.  ' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await verifyCaptchaToken('valid-token');
    expect(result).toBe(true);
  });

  it('rejects verification for a malicious suffix such as www.everloft.co.in.attacker.example', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-123';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, hostname: 'www.everloft.co.in.attacker.example' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await verifyCaptchaToken('valid-token');
    expect(result).toBe(false);
  });
});
