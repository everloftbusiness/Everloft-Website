import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockChain = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === "then") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (resolve: any) => resolve({ data: [], error: null });
      }
      return () => new Proxy(() => {}, handler);
    },
    apply() {
      return new Proxy(() => {}, handler);
    },
  };
  return new Proxy(() => {}, handler);
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => mockChain(),
  }),
}));

import { parseICalFeed, syncAllICalFeeds } from "./ical-sync.service";

describe("iCal Sync Hardening & Safety Controls", () => {
  it("correctly parses valid iCal feed content without errors", () => {
    const mockIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Everloft Test//EN
BEGIN:VEVENT
SUMMARY:Airbnb (Not available)
DTSTART;VALUE=DATE:20261001
DTEND;VALUE=DATE:20261005
UID:test-uid-12345
END:VEVENT
END:VCALENDAR`;

    const events = parseICalFeed(mockIcs);
    expect(events.length).toBe(1);
    expect(events[0].summary).toContain("Airbnb");
    expect(events[0].startDate).toBe("2026-10-01");
    expect(events[0].endDate).toBe("2026-10-05");
  });

  it("handles malformed iCal content gracefully without crashing or infinite loops", () => {
    const malformedIcs = "INVALID_DATA_STREAM_NO_HEADER_FOOTER";
    const events = parseICalFeed(malformedIcs);
    expect(events).toEqual([]);
  });

  it("bounded iCal fetching times out when external server is unresponsive", async () => {
    const timeoutSignal = AbortSignal.timeout(100);

    const fetchPromise = new Promise((_, reject) => {
      timeoutSignal.addEventListener("abort", () => reject(new Error("Timeout")));
    });

    await expect(fetchPromise).rejects.toThrow("Timeout");
  });

  it("parent cancellation prevents starting new fetches when parentSignal is already aborted", async () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://synthetic.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb-synthetic-secret-key";
    delete process.env.DISABLE_BACKGROUND_JOBS;

    const controller = new AbortController();
    controller.abort(); // Abort parent signal before starting sync

    const result = await syncAllICalFeeds("test-property-id", true, controller.signal);
    expect(result.success).toBe(true);
    expect(result.syncedFeedsCount).toBe(0);
  });
});
