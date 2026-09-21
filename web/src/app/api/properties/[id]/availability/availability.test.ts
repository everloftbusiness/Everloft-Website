import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockMaybeSingleProperty = vi.fn();
const mockMaybeSingleStatus = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "property_status") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => mockMaybeSingleStatus(),
            }),
          }),
        };
      }
      return {
        select: () => ({
          is: () => ({
            eq: () => ({
              maybeSingle: () => mockMaybeSingleProperty(),
            }),
          }),
        }),
      };
    },
  }),
}));

vi.mock("@/features/properties/services/ical-sync.service", () => ({
  getPropertyCalendarBlocks: async (propertyId: string) => [
    {
      id: "blk-1",
      propertyId,
      startDate: "2026-10-01T00:00:00.000Z",
      endDate: "2026-10-05T00:00:00.000Z",
      reason: "guest_booking",
      channelName: "Direct",
      notes: "CONFIDENTIAL: John Doe, phone +919876543210, paid INR 5000",
    },
  ],
}));

import { GET } from "./route";

describe("Hardened Public Property Availability API", () => {
  it("a. rejects malicious PostgREST filter injection strings with 404", async () => {
    const maliciousId = "prop-123,status_id.neq.0";
    const req = new Request(`http://localhost:3000/api/properties/${maliciousId}/availability`);
    const params = Promise.resolve({ id: maliciousId });
    const res = await GET(req, { params });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("b. rejects invalid path identifiers with 404", async () => {
    const invalidId = "invalid_id_with_special!@#chars";
    const req = new Request(`http://localhost:3000/api/properties/${invalidId}/availability`);
    const params = Promise.resolve({ id: invalidId });
    const res = await GET(req, { params });

    expect(res.status).toBe(404);
  });

  it("c. returns 404 for draft/inactive properties without revealing their state", async () => {
    mockMaybeSingleStatus.mockResolvedValue({ data: { id: "active-status-id" }, error: null });
    mockMaybeSingleProperty.mockResolvedValue({
      data: { id: "00000000-0000-0000-0000-000000000001", status_id: "draft-status-id" },
      error: null,
    });

    const req = new Request("http://localhost:3000/api/properties/villa-zephyr/availability");
    const params = Promise.resolve({ id: "villa-zephyr" });
    const res = await GET(req, { params });

    expect(res.status).toBe(404);
  });

  it("d. returns 404 for deleted or non-existent properties", async () => {
    mockMaybeSingleStatus.mockResolvedValue({ data: { id: "active-status-id" }, error: null });
    mockMaybeSingleProperty.mockResolvedValue({ data: null, error: null });

    const req = new Request("http://localhost:3000/api/properties/villa-deleted/availability");
    const params = Promise.resolve({ id: "villa-deleted" });
    const res = await GET(req, { params });

    expect(res.status).toBe(404);
  });

  it("e. returns 200 with sanitized date ranges only (stripping guest PII, notes, channel, prices)", async () => {
    mockMaybeSingleStatus.mockResolvedValue({ data: { id: "active-status-id" }, error: null });
    mockMaybeSingleProperty.mockResolvedValue({
      data: { id: "00000000-0000-0000-0000-000000000001", status_id: "active-status-id" },
      error: null,
    });

    const req = new Request("http://localhost:3000/api/properties/villa-zephyr/availability");
    const params = Promise.resolve({ id: "villa-zephyr" });
    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.blockedRanges.length).toBe(1);

    const range = body.blockedRanges[0];
    expect(range).toEqual({
      startDate: "2026-10-01",
      endDate: "2026-10-05",
    });

    const jsonStr = JSON.stringify(body);
    expect(jsonStr).not.toContain("John Doe");
    expect(jsonStr).not.toContain("+919876543210");
    expect(jsonStr).not.toContain("5000");
    expect(jsonStr).not.toContain("CONFIDENTIAL");
  });

  it("f. returns generic 500 on database error without revealing internal error details", async () => {
    mockMaybeSingleStatus.mockResolvedValue({ data: null, error: new Error("Database connection connection reset") });

    const req = new Request("http://localhost:3000/api/properties/villa-zephyr/availability");
    const params = Promise.resolve({ id: "villa-zephyr" });
    const res = await GET(req, { params });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Internal server error");
  });
});
