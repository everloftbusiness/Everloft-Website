import { z } from "zod";

// Wizard Step 5 — Amenities. Just a set of amenity_master IDs; the master
// list itself lives in the database (supabase/migrations/
// 20260731000004_property_amenities.sql, seeded in ...000014), never
// hardcoded here.
export const amenitiesSchema = z.object({
  amenityIds: z.array(z.string().uuid()).min(1, "Select at least one amenity."),
});

export type AmenitiesInput = z.infer<typeof amenitiesSchema>;
