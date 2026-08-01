import { z } from "zod";

// Wizard Step 7 — Pricing. Matches supabase/migrations/
// 20260731000009_property_pricing_tax_insurance.sql. This is the
// property's own rate CARD, not a booking transaction — see that
// migration's header comment for why pricing lives here and not in a
// future Revenue module.
export const pricingSchema = z.object({
  basePrice: z.number().positive("Base price is required."),
  weekendPrice: z.number().positive().optional(),
  monthlyPrice: z.number().positive().optional(),
  weeklyDiscountPercent: z.number().min(0).max(100).default(0),
  monthlyDiscountPercent: z.number().min(0).max(100).default(0),
  extraGuestFee: z.number().min(0).default(0),
  extraGuestAfter: z.number().int().min(1).optional(),
  cleaningFee: z.number().min(0).default(0),
  managementFeePercent: z.number().min(0).max(100).default(0),
  currency: z.string().length(3, "Use a 3-letter currency code (e.g. INR).").default("INR"),
  securityDepositAmount: z.number().min(0).optional(),
});

export const pricingOverrideSchema = z
  .object({
    overrideType: z.enum(["seasonal", "holiday"]),
    name: z.string().min(1).max(100),
    startDate: z.string().date(),
    endDate: z.string().date(),
    price: z.number().positive(),
    priority: z.number().int().default(0),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

export type PricingInput = z.infer<typeof pricingSchema>;
export type PricingOverrideInput = z.infer<typeof pricingOverrideSchema>;
