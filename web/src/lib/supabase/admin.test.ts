import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createAdminClient } from "./admin";

describe("Admin Supabase Client Guard", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws explicit error when NEXT_PUBLIC_SUPABASE_URL and SUPABASE_URL are missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_SECRET_KEY = "test-secret-key";

    expect(() => createAdminClient()).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL is missing. Privileged admin operations are unavailable in this environment."
    );
  });

  it("throws explicit error when SUPABASE_SECRET_KEY and SUPABASE_SERVICE_ROLE_KEY are missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://synthetic.supabase.co";
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => createAdminClient()).toThrow(
      "SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY is missing. Privileged admin operations are unavailable in this environment."
    );
  });

  it("successfully constructs admin client when valid URL and SUPABASE_SECRET_KEY are supplied", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://synthetic.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "test-secret-key-token";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => createAdminClient()).not.toThrow();
    const client = createAdminClient();
    expect(client).toBeDefined();
  });

  it("successfully constructs admin client when valid URL and legacy SUPABASE_SERVICE_ROLE_KEY are supplied", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://synthetic.supabase.co";
    delete process.env.SUPABASE_SECRET_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key-token";

    expect(() => createAdminClient()).not.toThrow();
    const client = createAdminClient();
    expect(client).toBeDefined();
  });
});
