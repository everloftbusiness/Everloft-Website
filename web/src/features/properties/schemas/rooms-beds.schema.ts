import { z } from "zod";

// Wizard Step 4 — Rooms & Beds. Matches supabase/migrations/
// 20260731000005_property_rooms_beds.sql — bed_type check constraint values
// mirrored exactly.
export const bedTypeSchema = z.enum([
  "king",
  "queen",
  "double",
  "single",
  "bunk",
  "sofa_bed",
  "floor_mattress",
  "crib",
  "extra_bed",
]);

export const bedSchema = z.object({
  bedType: bedTypeSchema,
  quantity: z.number().int().min(1).max(20),
  capacityPerBed: z.number().int().min(1).max(4).default(2),
});

export const roomSchema = z.object({
  roomTypeId: z.string().uuid("Select a room type."),
  name: z.string().min(1, "Room name is required.").max(100),
  floor: z.string().max(20).optional(),
  areaSqft: z.number().int().positive().optional(),
  hasAttachedBathroom: z.boolean().default(false),
  hasBalcony: z.boolean().default(false),
  hasAc: z.boolean().default(false),
  hasWardrobe: z.boolean().default(false),
  hasTv: z.boolean().default(false),
  hasWorkspace: z.boolean().default(false),
  description: z.string().max(1000).optional(),
  beds: z.array(bedSchema).min(0),
});

export const roomsBedsSchema = z.object({
  rooms: z.array(roomSchema).min(1, "Add at least one room."),
});

export type RoomInput = z.infer<typeof roomSchema>;
export type RoomsBedsInput = z.infer<typeof roomsBedsSchema>;
