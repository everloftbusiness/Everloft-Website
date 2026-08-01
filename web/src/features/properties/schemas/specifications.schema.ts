import { z } from "zod";

// Wizard Step 3 — Property Specifications.
export const specificationsSchema = z
  .object({
    bedrooms: z.number().int().min(0).max(50).optional(),
    bathrooms: z.number().int().min(0).max(50).optional(),
    toilets: z.number().int().min(0).max(50).optional(),
    livingRooms: z.number().int().min(0).max(10).optional(),
    diningRooms: z.number().int().min(0).max(10).optional(),
    hasKitchen: z.boolean().default(true),
    hasStudyRoom: z.boolean().default(false),
    hasBalcony: z.boolean().default(false),
    hasTerrace: z.boolean().default(false),
    hasGarden: z.boolean().default(false),
    hasSwimmingPool: z.boolean().default(false),
    hasParking: z.boolean().default(false),
    hasGarage: z.boolean().default(false),
    floorNumber: z.string().max(20).optional(),
    buildingName: z.string().max(150).optional(),
    hasLift: z.boolean().default(false),
    propertyAreaSqft: z.number().int().positive().optional(),
    builtUpAreaSqft: z.number().int().positive().optional(),
    plotAreaSqft: z.number().int().positive().optional(),
    maxGuests: z.number().int().min(1, "Maximum guests must be at least 1.").max(200),
    minGuests: z.number().int().min(1).default(1),
    yearBuilt: z
      .number()
      .int()
      .min(1800)
      .max(new Date().getFullYear())
      .optional(),
    lastRenovatedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  })
  .refine((data) => data.minGuests <= data.maxGuests, {
    message: "Minimum guests cannot exceed maximum guests.",
    path: ["minGuests"],
  });

export type SpecificationsInput = z.infer<typeof specificationsSchema>;
