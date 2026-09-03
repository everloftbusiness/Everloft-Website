"use client";

import Image from "next/image";
import {
  BedDouble,
  Bath,
  Sun,
  Tv,
  Wind,
  Laptop,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Eye,
} from "lucide-react";
import type { PropertyPhotoItem, PropertyRoomSpecs } from "@/features/properties/types/property.types";
import { PropertyMedia } from "@/components/media/property-media";

export function PropertyBedroomsShowcase({
  bedroomsCount,
  roomSpecs = {},
  photos = [],
  propertyName,
}: {
  bedroomsCount: number | null;
  roomSpecs?: PropertyRoomSpecs;
  photos?: PropertyPhotoItem[];
  propertyName: string;
}) {
  const hasSpecs = Object.keys(roomSpecs).length > 0;
  const numBedrooms = bedroomsCount && bedroomsCount > 0 ? bedroomsCount : 0;

  if (numBedrooms === 0 && !hasSpecs) {
    return null;
  }

  // Derive bedroom keys: either from count or existing roomSpecs keys
  const bedroomKeys = numBedrooms > 0
    ? Array.from({ length: numBedrooms }, (_, i) => `Bedroom ${i + 1}`)
    : Object.keys(roomSpecs);

  return (
    <section id="where-you-will-sleep" className="border-t border-border/80 pt-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            <BedDouble className="h-4 w-4" />
            Accommodations
          </div>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Where You&apos;ll Sleep
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            {bedroomKeys.length} curated bedroom suite{bedroomKeys.length === 1 ? "" : "s"} with premium hotel-grade linens, fresh sanitized duvets & climate control
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 text-xs font-bold text-emerald-900 dark:text-emerald-300 border border-emerald-500/20">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          {bedroomKeys.length} Private Bedroom{bedroomKeys.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Bedrooms Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {bedroomKeys.map((roomName) => {
          const spec = roomSpecs[roomName] ?? {};
          const bedType = spec.bedType && spec.bedType.trim() ? spec.bedType.trim() : null;

          // Dynamically construct room amenities strictly from actual spec data
          const dynamicAmenities: string[] = [];
          if (bedType) dynamicAmenities.push(bedType);
          if (spec.hasAc) dynamicAmenities.push("Air Conditioned");
          if (spec.bathroomType === "attached") dynamicAmenities.push("Attached Bathroom");
          else if (spec.bathroomType === "dedicated") dynamicAmenities.push("Dedicated Bathroom");
          else if (spec.bathroomType === "common") dynamicAmenities.push("Common Bathroom");
          if (spec.hasBalcony) dynamicAmenities.push("Private Balcony");
          if (spec.hasWorkDesk) dynamicAmenities.push("Work Desk");
          if (spec.hasTv) dynamicAmenities.push("Smart TV");
          if (spec.hasWardrobe) dynamicAmenities.push("Wardrobe Storage");
          if (spec.viewType && spec.viewType.trim()) dynamicAmenities.push(`${spec.viewType.trim()} View`);

          if (spec.amenities && Array.isArray(spec.amenities)) {
            spec.amenities.forEach((a) => {
              if (a && typeof a === "string" && !dynamicAmenities.includes(a.trim())) {
                dynamicAmenities.push(a.trim());
              }
            });
          }

          // Find specific photo matching this bedroom
          const matchingPhoto = photos.find((p) => {
            const tag = (p.spaceTag || "").toLowerCase().trim();
            return tag === roomName.toLowerCase() || tag.startsWith(roomName.toLowerCase());
          });

          return (
            <div
              key={roomName}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-500/40"
            >
              {/* Photo Thumbnail */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                {matchingPhoto ? (
                  <Image
                    src={matchingPhoto.url}
                    alt={matchingPhoto.alt || `${propertyName} - ${roomName}`}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <PropertyMedia
                    seed={`${propertyName}-${roomName}`}
                    type="Bedroom"
                    label={roomName}
                    className="h-full w-full"
                  />
                )}
                <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur border border-white/10">
                  {roomName}
                </div>
              </div>

              {/* Bedroom Details Card Body */}
              <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      <BedDouble className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{roomName}</p>
                      {bedType && (
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {bedType}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic Amenities Badges */}
                {dynamicAmenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/60">
                    {dynamicAmenities.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-foreground"
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{item}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
