import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockSyncAllICalFeeds = vi.fn().mockResolvedValue({
  success: true,
  totalSyncedEvents: 5,
  syncedFeedsCount: 1,
  message: "Synced 1 feed",
});

vi.mock("@/features/properties/services/ical-sync.service", () => ({
  syncAllICalFeeds: (propId: string, force: boolean, signal?: AbortSignal) => mockSyncAllICalFeeds(propId, force, signal),
}));

const createAdminClientSpy = vi.fn().mockImplementation(() => ({
  from: (table: string) => {
    if (table === "property_status") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { id: "status-active-id" }, error: null }),
          }),
        }),
      };
    }
    return {
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () => ({
              limit: async () => ({
                data: [
                  { id: "00000000-0000-0000-0000-000000000001", name: "Villa Zephyr" },
                  { id: "00000000-0000-0000-0000-000000000002", name: "Loft Oasis" },
                ],
                error: null,
              }),
            }),
          }),
        }),
      }),
    };
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientSpy(),
}));

import { GET } from "./route";

describe("Protected Cron iCal Synchronization Endpoint", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockSyncAllICalFeeds.mockClear();
    createAdminClientSpy.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("1. performs ZERO work and skips when ENABLE_ICAL_CRON is missing or not true", async () => {
    delete process.env.ENABLE_ICAL_CRON;
    process.env.CRON_SECRET = "super_secret_cron_key_123";
    process.env.VERCEL_ENV = "production";
    const req = new Request("http://localhost:3000/api/cron/sync-ical", {
      headers: { authorization: "Bearer super_secret_cron_key_123" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain("ENABLE_ICAL_CRON");
    expect(createAdminClientSpy).not.toHaveBeenCalled();
    expect(mockSyncAllICalFeeds).not.toHaveBeenCalled();
  });

  it("2. rejects request with 401 and executes ZERO sync operations when CRON_SECRET is missing", async () => {
    process.env.ENABLE_ICAL_CRON = "true";
    delete process.env.CRON_SECRET;
    process.env.VERCEL_ENV = "production";
    const req = new Request("http://localhost:3000/api/cron/sync-ical", {
      headers: { authorization: "Bearer any_token" },
    });
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(createAdminClientSpy).not.toHaveBeenCalled();
    expect(mockSyncAllICalFeeds).not.toHaveBeenCalled();
  });

  it("3. rejects request with 401 when Authorization header is invalid or missing", async () => {
    process.env.ENABLE_ICAL_CRON = "true";
    process.env.CRON_SECRET = "super_secret_cron_key_123";
    process.env.VERCEL_ENV = "production";
    const req = new Request("http://localhost:3000/api/cron/sync-ical", {
      headers: { authorization: "Bearer wrong_secret_key_999" },
    });
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(createAdminClientSpy).not.toHaveBeenCalled();
    expect(mockSyncAllICalFeeds).not.toHaveBeenCalled();
  });

  it("4. skips cron execution safely and performs zero sync operations when running inside Preview environment", async () => {
    process.env.ENABLE_ICAL_CRON = "true";
    process.env.CRON_SECRET = "super_secret_cron_key_123";
    process.env.VERCEL_ENV = "preview";
    const req = new Request("http://localhost:3000/api/cron/sync-ical", {
      headers: { authorization: "Bearer super_secret_cron_key_123" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain("skipped");
    expect(createAdminClientSpy).not.toHaveBeenCalled();
    expect(mockSyncAllICalFeeds).not.toHaveBeenCalled();
  });

  it("5. executes sync operations when ENABLE_ICAL_CRON=true, CRON_SECRET is valid, and in Production", async () => {
    process.env.ENABLE_ICAL_CRON = "true";
    process.env.CRON_SECRET = "super_secret_cron_key_123";
    process.env.VERCEL_ENV = "production";
    const req = new Request("http://localhost:3000/api/cron/sync-ical", {
      headers: { authorization: "Bearer super_secret_cron_key_123" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(createAdminClientSpy).toHaveBeenCalledTimes(1);
    expect(body.propertiesProcessed).toBe(2);
    expect(mockSyncAllICalFeeds).toHaveBeenCalledTimes(2);
  });
});
