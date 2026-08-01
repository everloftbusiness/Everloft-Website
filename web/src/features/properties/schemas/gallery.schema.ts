import { z } from "zod";

// Wizard Step 6 — Gallery. Files themselves are uploaded via the already-
// live POST /api/files/upload (docs/STORAGE_ARCHITECTURE.md) — this schema
// only validates the resulting metadata rows being attached to the
// property (supabase/migrations/20260731000006_property_media.sql).
export const galleryPhotoSchema = z.object({
  fileId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  caption: z.string().max(200).optional(),
  tags: z.array(z.string().max(30)).max(10).default([]),
  sortOrder: z.number().int().min(0).default(0),
  isCover: z.boolean().default(false),
});

export const galleryVideoSchema = z.object({
  fileId: z.string().uuid(),
  videoType: z.enum(["walkthrough", "drone", "virtual_tour_360"]).default("walkthrough"),
  caption: z.string().max(200).optional(),
});

export const gallerySchema = z
  .object({
    photos: z.array(galleryPhotoSchema).min(5, "Add at least 5 photos."),
    videos: z.array(galleryVideoSchema).max(20).default([]),
  })
  .refine((data) => data.photos.filter((p) => p.isCover).length <= 1, {
    message: "Only one photo can be marked as the cover image.",
    path: ["photos"],
  });

export type GalleryInput = z.infer<typeof gallerySchema>;
