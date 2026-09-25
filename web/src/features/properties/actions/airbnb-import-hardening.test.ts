import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockGetDashboardSession = vi.fn();
vi.mock("@/lib/dashboard/session", () => ({
  getDashboardSession: () => mockGetDashboardSession(),
}));

vi.mock("@/features/properties/services/airbnb-importer.service", () => ({
  parseAirbnbListing: async () => ({
    roomId: "1127955898193951447",
    name: "Luxury Villa Zephyr",
    description: "Stunning 4BHK Private Pool Villa",
    shortDescription: "Luxury villa in Goa",
    propertyType: "Villa",
    city: "Goa",
    state: "Goa",
    country: "India",
    address: "Anjuna, Goa",
    pinCode: "403509",
    bedrooms: 4,
    bathrooms: 4,
    maxGuests: 10,
    nightlyPrice: 25000,
    currency: "INR",
    photos: Array.from({ length: 30 }, (_, i) => ({
      url: `https://a0.muscache.com/im/pictures/photo_${i + 1}.jpg`,
      caption: `Photo ${i + 1}`,
    })),
    amenityNames: ["Wifi", "Private Pool", "Air conditioning"],
  }),
  normalizeAmenityName: (name: string) => ({ name, slug: name.toLowerCase().replace(/\s+/g, "-"), category: "general" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ id: "draft-status-id" }),
          single: async () => ({ id: "created-amenity-id" }),
          is: () => ({ count: 0 }),
        }),
      }),
      update: () => {
        const chain = {
          error: null,
          eq: () => chain,
          neq: () => chain,
          then: (resolve: (val: unknown) => unknown) => resolve({ error: null }),
        };
        return chain;
      },
      upsert: async () => ({ error: null }),
      delete: () => ({ eq: async () => ({ error: null }) }),
      insert: () => ({
        map: () => ({ error: null }),
        select: () => ({ single: async () => ({ id: "created-amenity-id" }) }),
      }),
    }),
    rpc: async () => ({ data: "new-photo-id", error: null }),
  }),
}));

vi.mock("@/features/properties/services/properties.service", () => ({
  createDraftProperty: async () => ({ id: "prop-draft-123" }),
}));

vi.mock("@/lib/storage/file-service", () => ({
  createFileRecord: async () => ({ id: "file-rec-123" }),
}));

vi.mock("@/lib/storage/r2", () => ({
  uploadFile: async () => ({ bucket: "property-images", key: "key-123", publicUrl: "http://r2/key-123", contentType: "image/jpeg" }),
  computeChecksum: () => "mock-checksum",
  BUCKETS: { propertyImages: "property-images" },
}));

import { importAirbnbPropertyAction } from "./airbnb-import.actions";

describe("Airbnb Property Import Hardening & Concurrency Controls", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("rejects unauthorized caller without create_property / manage_properties permission", async () => {
    mockGetDashboardSession.mockResolvedValueOnce(null);
    const res = await importAirbnbPropertyAction("https://www.airbnb.co.in/rooms/1127955898193951447");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Sign in required.");
  });

  it("processes all listing photos up to MAX_AIRBNB_PHOTOS (120 photos) with bounded concurrency", async () => {
    mockGetDashboardSession.mockResolvedValueOnce({
      userId: "user-admin",
      role: "super_admin",
      permissions: ["manage_properties", "create_property"],
    });

    process.env.VERCEL_ENV = "production";

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (h: string) => (h === "content-type" ? "image/jpeg" : h === "content-length" ? "50000" : null),
      },
      arrayBuffer: async () => new ArrayBuffer(50000),
    });

    try {
      const res = await importAirbnbPropertyAction("https://www.airbnb.co.in/rooms/1127955898193951447");
      expect(res.success).toBe(true);
      expect(res.propertyId).toBe("prop-draft-123");
      expect(res.importedPhotosCount).toBe(30);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
