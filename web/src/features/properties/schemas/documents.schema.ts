import { z } from "zod";

// Wizard Step 10 — Documents. document_type values mirror the check
// constraint in supabase/migrations/20260731000006_property_media.sql.
export const documentTypeSchema = z.enum([
  "management_agreement",
  "owner_agreement",
  "insurance",
  "tax",
  "floor_plan",
  "gst",
  "property_tax",
  "electric_bill",
  "water_bill",
  "gas_bill",
  "legal",
  "other",
]);

export const propertyDocumentSchema = z.object({
  fileId: z.string().uuid(),
  documentType: documentTypeSchema,
  expiryDate: z.string().date().optional(),
});

export const documentsSchema = z.object({
  documents: z.array(propertyDocumentSchema).default([]),
});

export type DocumentsInput = z.infer<typeof documentsSchema>;
