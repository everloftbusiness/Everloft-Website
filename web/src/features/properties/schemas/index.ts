import { z } from "zod";
import { basicInfoSchema } from "./basic-info.schema";
import { locationSchema } from "./location.schema";
import { specificationsSchema } from "./specifications.schema";
import { roomsBedsSchema } from "./rooms-beds.schema";
import { amenitiesSchema } from "./amenities.schema";
import { gallerySchema } from "./gallery.schema";
import { pricingSchema } from "./pricing.schema";
import { houseRulesSchema } from "./house-rules.schema";
import { utilitiesSchema } from "./utilities.schema";
import { documentsSchema } from "./documents.schema";
import { otaSchema } from "./ota.schema";

export * from "./basic-info.schema";
export * from "./location.schema";
export * from "./specifications.schema";
export * from "./rooms-beds.schema";
export * from "./amenities.schema";
export * from "./gallery.schema";
export * from "./pricing.schema";
export * from "./house-rules.schema";
export * from "./utilities.schema";
export * from "./documents.schema";
export * from "./ota.schema";

// One schema per wizard step (docs/PROPERTY_MANAGEMENT_MODULE.md §8) —
// each step validates independently so "Save & Continue Later" can persist
// a partially-complete draft without the whole form needing to be valid.
export const PROPERTY_WIZARD_STEPS = [
  { key: "basicInfo", label: "Basic Information", schema: basicInfoSchema },
  { key: "location", label: "Location", schema: locationSchema },
  { key: "specifications", label: "Property Specifications", schema: specificationsSchema },
  { key: "roomsBeds", label: "Rooms & Beds", schema: roomsBedsSchema },
  { key: "amenities", label: "Amenities", schema: amenitiesSchema },
  { key: "gallery", label: "Gallery", schema: gallerySchema },
  { key: "pricing", label: "Pricing", schema: pricingSchema },
  { key: "houseRules", label: "House Rules", schema: houseRulesSchema },
  { key: "utilities", label: "Utilities", schema: utilitiesSchema },
  { key: "documents", label: "Documents", schema: documentsSchema },
  { key: "ota", label: "OTA Information", schema: otaSchema },
] as const;

// Step 12, "Review & Publish," has no fields of its own — it's a read-only
// summary of steps 1-11 plus a publish action, so there's no schema for it.

// The full submission, used only at final publish time (each step's own
// schema is what actually gates "can I move to the next step").
export const propertyWizardSchema = z.object({
  basicInfo: basicInfoSchema,
  location: locationSchema,
  specifications: specificationsSchema,
  roomsBeds: roomsBedsSchema,
  amenities: amenitiesSchema,
  gallery: gallerySchema,
  pricing: pricingSchema,
  houseRules: houseRulesSchema,
  utilities: utilitiesSchema,
  documents: documentsSchema,
  ota: otaSchema,
});

export type PropertyWizardInput = z.infer<typeof propertyWizardSchema>;
