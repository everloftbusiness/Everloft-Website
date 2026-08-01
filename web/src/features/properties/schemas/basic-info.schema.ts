import { z } from "zod";

// Wizard Step 1 — Basic Information. Matches supabase/migrations/
// 20260731000001_properties_expand_info_location_specs.sql +
// 20260731000002_property_lookups.sql exactly (property_type_id/status_id/
// category_id reference the seeded lookup tables, not free text).
export const basicInfoSchema = z.object({
  name: z.string().min(2, "Property name is required.").max(200),
  internalCode: z.string().max(50).optional(),
  shortName: z.string().max(100).optional(),
  typeId: z.string().uuid("Select a property type."),
  categoryId: z.string().uuid().optional(),
  ownerId: z.string().uuid("Select a property owner.").optional(),
  primaryInvestorId: z.string().uuid().optional(),
  managedBy: z.string().uuid().optional(),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(300).optional(),
  highlights: z.array(z.string().max(120)).max(10).optional(),
  usp: z.string().max(200).optional(),
});

export type BasicInfoInput = z.infer<typeof basicInfoSchema>;
