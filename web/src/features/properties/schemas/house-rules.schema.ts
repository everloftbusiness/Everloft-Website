import { z } from "zod";

// Wizard Step 8 — House Rules. rule_key/policy_type values mirror the check
// constraints in supabase/migrations/20260731000007_property_rules_policies_tags.sql
// exactly.
export const ruleKeySchema = z.enum([
  "quiet_hours",
  "smoking",
  "pets",
  "visitors",
  "parties",
  "commercial_shoots",
  "alcohol",
  "id_required",
  "minimum_age",
  "cleaning",
  "waste_disposal",
  "parking",
  "community",
  "other",
]);

export const houseRuleSchema = z.object({
  ruleKey: ruleKeySchema,
  ruleText: z.string().min(1).max(500),
});

export const cancellationTierSchema = z.object({
  daysBefore: z.number().int().min(0),
  refundPercent: z.number().min(0).max(100),
});

export const houseRulesSchema = z.object({
  checkInTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour)."),
  checkOutTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour)."),
  securityDepositAmount: z.number().min(0).optional(),
  securityDepositCurrency: z.string().length(3).optional(),
  cancellationTiers: z.array(cancellationTierSchema).min(1, "Add at least one cancellation tier."),
  rules: z.array(houseRuleSchema).default([]),
});

export type HouseRulesInput = z.infer<typeof houseRulesSchema>;
