import { z } from "zod";

// Wizard Step 11 — OTA Information. channel values mirror the check
// constraint in supabase/migrations/20260731000012_property_integrations.sql.
export const otaChannelSchema = z.enum([
  "airbnb",
  "booking_com",
  "agoda",
  "makemytrip",
  "goibibo",
  "vrbo",
  "direct",
]);

export const otaIntegrationSchema = z.object({
  channel: otaChannelSchema,
  listingId: z.string().max(150).optional(),
  listingUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["inactive", "active", "paused", "error"]).default("inactive"),
});

export const otaSchema = z.object({
  integrations: z.array(otaIntegrationSchema).default([]),
});

export type OtaInput = z.infer<typeof otaSchema>;
