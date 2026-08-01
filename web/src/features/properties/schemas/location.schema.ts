import { z } from "zod";

// Wizard Step 2 — Location. what3words is future-ready (accepted, not
// required) per docs/PROPERTY_MANAGEMENT_MODULE.md.
export const locationSchema = z.object({
  country: z.string().min(1, "Country is required."),
  state: z.string().optional(),
  district: z.string().optional(),
  city: z.string().min(1, "City is required."),
  area: z.string().optional(),
  street: z.string().optional(),
  address: z.string().min(1, "Address is required."),
  landmark: z.string().optional(),
  pinCode: z.string().max(12).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  googleMapsUrl: z.string().url().optional().or(z.literal("")),
  what3words: z
    .string()
    .regex(/^\/\/\/[a-z]+\.[a-z]+\.[a-z]+$/, "Format: ///word.word.word")
    .optional()
    .or(z.literal("")),
  timezone: z.string().min(1, "Timezone is required."),
});

export type LocationInput = z.infer<typeof locationSchema>;
