import { z } from "zod";

// Wizard Step 9 — Utilities. One row per utility_type (electricity, water,
// gas, internet, association_fee — supabase/migrations/
// 20260731000011_property_utilities.sql), not five separate schemas.
export const utilityAccountSchema = z.object({
  utilityTypeId: z.string().uuid(),
  providerName: z.string().max(150).optional(),
  accountNumber: z.string().max(100).optional(),
  meterNumber: z.string().max(100).optional(),
  hasSolar: z.boolean().default(false),
  hasPowerBackup: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export const utilitiesSchema = z.object({
  accounts: z.array(utilityAccountSchema).default([]),
});

export type UtilitiesInput = z.infer<typeof utilitiesSchema>;
