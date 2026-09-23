import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetMemoryRateLimits } from './rate-limit';

describe('Durable Rate Limiter Namespace Isolation', () => {
  beforeEach(() => {
    resetMemoryRateLimits();
  });

  it('isolates rate limit counts between distinct namespaces', async () => {
    const ip = '192.168.1.50';

    // Exhaust 'contact_form' namespace (limit 2)
    const r1 = await checkRateLimit('contact_form', ip, { maxRequests: 2 });
    const r2 = await checkRateLimit('contact_form', ip, { maxRequests: 2 });
    const r3 = await checkRateLimit('contact_form', ip, { maxRequests: 2 });

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);

    // 'newsletter_sub' namespace for SAME IP should still be allowed!
    const rNewsletter = await checkRateLimit('newsletter_sub', ip, { maxRequests: 2 });
    expect(rNewsletter.allowed).toBe(true);
    expect(rNewsletter.remaining).toBe(1);
  });

  it('calculates remaining requests accurately', async () => {
    const ip = '10.0.0.1';
    const res = await checkRateLimit('login', ip, { maxRequests: 5 });
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(4);
  });
});
