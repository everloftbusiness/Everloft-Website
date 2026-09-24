import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkRateLimit,
  resetMemoryRateLimits,
  hashClientIdentifier,
  getClientIp,
} from "./rate-limit";

describe("Atomic Durable Rate Limiter", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetMemoryRateLimits();
    process.env = { ...originalEnv };
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.VERCEL_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("hashes client identifier using HMAC and does not expose raw IPs", () => {
    const rawIp = "192.168.1.100";
    const hashed1 = hashClientIdentifier(rawIp);
    const hashed2 = hashClientIdentifier(rawIp);
    const hashedOther = hashClientIdentifier("192.168.1.101");

    expect(hashed1).toBe(hashed2);
    expect(hashed1).not.toBe(rawIp);
    expect(hashed1).not.toBe(hashedOther);
    expect(hashed1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex string
  });

  it("extracts client IP safely from x-forwarded-for or x-real-ip", () => {
    const req1 = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    expect(getClientIp(req1)).toBe("203.0.113.195");

    const req2 = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.4" },
    });
    expect(getClientIp(req2)).toBe("198.51.100.4");

    const req3 = new Request("http://localhost");
    expect(getClientIp(req3)).toBe("127.0.0.1");
  });

  it("permits requests within max limit and denies subsequent requests", async () => {
    const ip = "10.0.0.1";
    const namespace = "test_limiter";

    for (let i = 0; i < 3; i++) {
      const res = await checkRateLimit(namespace, ip, {
        windowMs: 60_000,
        maxRequests: 3,
      });
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(2 - i);
    }

    // 4th request exceeds max
    const blockedRes = await checkRateLimit(namespace, ip, {
      windowMs: 60_000,
      maxRequests: 3,
    });
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
  });

  it("resets count when time window expires", async () => {
    const ip = "10.0.0.2";
    const namespace = "window_test";

    // Allow 1 request per 100ms
    const first = await checkRateLimit(namespace, ip, {
      windowMs: 50,
      maxRequests: 1,
    });
    expect(first.allowed).toBe(true);

    const second = await checkRateLimit(namespace, ip, {
      windowMs: 50,
      maxRequests: 1,
    });
    expect(second.allowed).toBe(false);

    // Wait 60ms for window to expire
    await new Promise((resolve) => setTimeout(resolve, 60));

    const third = await checkRateLimit(namespace, ip, {
      windowMs: 50,
      maxRequests: 1,
    });
    expect(third.allowed).toBe(true);
  });

  it("maintains separate limits for different namespaces and different IPs", async () => {
    const ipA = "10.0.0.3";
    const ipB = "10.0.0.4";

    const resA = await checkRateLimit("login", ipA, { maxRequests: 1 });
    const resB = await checkRateLimit("login", ipB, { maxRequests: 1 });
    const resAOtherNs = await checkRateLimit("contact", ipA, { maxRequests: 1 });

    expect(resA.allowed).toBe(true);
    expect(resB.allowed).toBe(true);
    expect(resAOtherNs.allowed).toBe(true);
  });

  it("handles concurrent requests without throwing", async () => {
    const ip = "10.0.0.5";
    const namespace = "concurrency_test";

    const results = await Promise.all([
      checkRateLimit(namespace, ip, { maxRequests: 5 }),
      checkRateLimit(namespace, ip, { maxRequests: 5 }),
      checkRateLimit(namespace, ip, { maxRequests: 5 }),
      checkRateLimit(namespace, ip, { maxRequests: 5 }),
      checkRateLimit(namespace, ip, { maxRequests: 5 }),
      checkRateLimit(namespace, ip, { maxRequests: 5 }),
    ]);

    const allowed = results.filter((r) => r.allowed);
    const denied = results.filter((r) => !r.allowed);

    expect(allowed.length).toBe(5);
    expect(denied.length).toBe(1);
  });

  it("fails closed in Production when database RPC errors", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.SUPABASE_SECRET_KEY = "dummy-secret-key";

    // Dynamic import to mock createAdminClient
    const adminModule = await import("@/lib/supabase/admin");
    vi.spyOn(adminModule, "createAdminClient").mockImplementation(() => ({
      rpc: vi.fn().mockResolvedValue({ data: null, error: new Error("DB connection failure") }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any));

    const result = await checkRateLimit("prod_test", "1.2.3.4", { maxRequests: 5 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("refuses hardcoded default salt and fails closed in Production when salt and secret key are missing", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.RATE_LIMIT_SALT;
    delete process.env.SUPABASE_SECRET_KEY;

    expect(() => hashClientIdentifier("1.2.3.4")).toThrow(
      /RATE_LIMIT_SALT .* must be configured in Preview and Production/
    );

    const result = await checkRateLimit("prod_test", "1.2.3.4", { maxRequests: 5 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("refuses hardcoded default salt and fails closed in Vercel Preview when salt and secret key are missing", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    (process.env as Record<string, string | undefined>).VERCEL_ENV = "preview";
    delete process.env.RATE_LIMIT_SALT;
    delete process.env.SUPABASE_SECRET_KEY;

    expect(() => hashClientIdentifier("1.2.3.4")).toThrow(
      /RATE_LIMIT_SALT .* must be configured in Preview and Production/
    );

    const result = await checkRateLimit("preview_test", "1.2.3.4", { maxRequests: 5 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("permits hashing when RATE_LIMIT_SALT is provided in Production", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.RATE_LIMIT_SALT = "custom-prod-salt-xyz";
    delete process.env.SUPABASE_SECRET_KEY;

    const hash = hashClientIdentifier("1.2.3.4");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("permits hashing when SUPABASE_SECRET_KEY is used as fallback in Production", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.RATE_LIMIT_SALT;
    process.env.SUPABASE_SECRET_KEY = "fallback-secret-key-xyz";

    const hash = hashClientIdentifier("1.2.3.4");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
