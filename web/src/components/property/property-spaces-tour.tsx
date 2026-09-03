"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  BedDouble,
  Sofa,
  UtensilsCrossed,
  Bath,
  Sun,
  Car,
  Shirt,
  Building,
  TreePine,
  Laptop,
  Utensils,
  Waves,
  Gamepad2,
  Dumbbell,
  Compass,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { PropertyPhotoItem } from "@/features/properties/types/property.types";

const SPACE_ICON_MAP: Record<string, React.ElementType> = {
  "Living Room": Sofa,
  "Bedroom 1": BedDouble,
  "Bedroom 2": BedDouble,
  "Bedroom 3": BedDouble,
  "Bedroom 4": BedDouble,
  "Bedroom 5": BedDouble,
  "Kitchen": UtensilsCrossed,
  "Dining Area": Utensils,
  "Bathrooms": Bath,
  "Bathroom 1": Bath,
  "Bathroom 2": Bath,
  "Bathroom 3": Bath,
  "Bathroom 4": Bath,
  "Balcony": Sun,
  "Balcony & Views": Sun,
  "Terrace": Sun,
  "Private Swimming Pool": Waves,
  "Garden & Lawn": TreePine,
  "Entertainment & Games": Gamepad2,
  "Gym & Fitness": Dumbbell,
  "Car Parking": Car,
  "Laundry & Utility": Shirt,
  "Dedicated Workspace": Laptop,
  "Exterior & Entrance": Building,
  "Surroundings & Views": Compass,
};

function matchSpaceAmenities(spaceTag: string, amenities: string[] = []): string[] {
  if (!amenities || amenities.length === 0) return [];

  const lowerSpace = spaceTag.toLowerCase();
  const matched: string[] = [];

  amenities.forEach((a) => {
    const lowerA = a.toLowerCase();
    if (lowerSpace.startsWith("bedroom") && (lowerA.includes("bed") || lowerA.includes("linen") || lowerA.includes("pillow") || lowerA.includes("wardrobe") || lowerA.includes("curtain") || lowerA.includes("ac") || lowerA.includes("air cond"))) {
      matched.push(a);
    } else if (lowerSpace.startsWith("bathroom") && (lowerA.includes("bath") || lowerA.includes("shower") || lowerA.includes("hot water") || lowerA.includes("geyser") || lowerA.includes("towel") || lowerA.includes("toilet") || lowerA.includes("soap") || lowerA.includes("shampoo"))) {
      matched.push(a);
    } else if (lowerSpace === "kitchen" && (lowerA.includes("kitchen") || lowerA.includes("refrigerator") || lowerA.includes("microwave") || lowerA.includes("stove") || lowerA.includes("cook") || lowerA.includes("water") || lowerA.includes("oven") || lowerA.includes("dish"))) {
      matched.push(a);
    } else if (lowerSpace === "dining area" && (lowerA.includes("dining") || lowerA.includes("table") || lowerA.includes("bar") || lowerA.includes("cutlery"))) {
      matched.push(a);
    } else if (lowerSpace === "living room" && (lowerA.includes("tv") || lowerA.includes("sofa") || lowerA.includes("living") || lowerA.includes("couch") || lowerA.includes("wifi"))) {
      matched.push(a);
    } else if ((lowerSpace === "balcony" || lowerSpace === "balcony & views") && (lowerA.includes("balcony") || lowerA.includes("view") || lowerA.includes("outdoor furniture"))) {
      matched.push(a);
    } else if (lowerSpace === "terrace" && (lowerA.includes("terrace") || lowerA.includes("rooftop") || lowerA.includes("bbq") || lowerA.includes("grill"))) {
      matched.push(a);
    } else if (lowerSpace.includes("pool") && (lowerA.includes("pool") || lowerA.includes("swimming") || lowerA.includes("jacuzzi") || lowerA.includes("sun lounger"))) {
      matched.push(a);
    } else if (lowerSpace.includes("parking") && (lowerA.includes("parking") || lowerA.includes("garage") || lowerA.includes("ev") || lowerA.includes("charger") || lowerA.includes("car"))) {
      matched.push(a);
    } else if (lowerSpace.includes("laundry") && (lowerA.includes("washer") || lowerA.includes("washing") || lowerA.includes("dryer") || lowerA.includes("iron") || lowerA.includes("laundry"))) {
      matched.push(a);
    } else if (lowerSpace.includes("gym") && (lowerA.includes("gym") || lowerA.includes("fitness") || lowerA.includes("workout") || lowerA.includes("yoga"))) {
      matched.push(a);
    } else if (lowerSpace.includes("workspace") && (lowerA.includes("workspace") || lowerA.includes("desk") || lowerA.includes("chair") || lowerA.includes("wifi"))) {
      matched.push(a);
    }
  });

  return Array.from(new Set(matched)).slice(0, 4);
}

function getSpaceAttributes(
  spaceTag: string,
  roomSpecs?: import("@/features/properties/types/property.types").PropertyRoomSpecs,
  amenities: string[] = []
): string[] {
  if (spaceTag.startsWith("Bedroom") && roomSpecs && roomSpecs[spaceTag]) {
    const spec = roomSpecs[spaceTag];
    if (spec.amenities && spec.amenities.length > 0) {
      return spec.amenities;
    }
    const badges: string[] = [];
    if (spec.bedType && spec.bedType.trim()) badges.push(spec.bedType.trim());
    if (spec.hasAc) badges.push("Air Conditioning (AC)");
    if (spec.hasBalcony) badges.push("Private Balcony");
    if (spec.hasWorkDesk) badges.push("Work Desk & Chair");
    if (spec.hasTv) badges.push("Smart TV");
    if (spec.hasWardrobe) badges.push("Wardrobe Storage");
    if (spec.viewType && spec.viewType.trim()) badges.push(`${spec.viewType.trim()} View`);
    return badges;
  }

  return matchSpaceAmenities(spaceTag, amenities);
}

export function PropertySpacesTour({
  photos,
  propertyName,
  amenities = [],
  roomSpecs,
}: {
  photos: PropertyPhotoItem[];
  propertyName: string;
  amenities?: string[];
  roomSpecs?: import("@/features/properties/types/property.types").PropertyRoomSpecs;
}) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Group photos by spaceTag
  const spacesGrouped = useMemo(() => {
    const map = new Map<string, PropertyPhotoItem[]>();
    photos.forEach((photo) => {
      const space = photo.spaceTag || "Living Room";
      if (!map.has(space)) {
        map.set(space, []);
      }
      map.get(space)!.push(photo);
    });
    return map;
  }, [photos]);

  const spaceKeys = useMemo(() => Array.from(spacesGrouped.keys()), [spacesGrouped]);

  const activePhotos = useMemo(() => {
    if (activeTab === "all") return photos;
    return spacesGrouped.get(activeTab) || [];
  }, [photos, spacesGrouped, activeTab]);

  if (photos.length === 0) return null;

  return (
    <section className="border-t border-border/80 bg-background py-16">
      <div className="site-container space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Room-by-Room Tour</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mt-1">
              Explore the Spaces & Rooms
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
              Inspect every private room, outdoor balcony, parking, and utility space before reserving your stay.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 border border-border">
              {photos.length} Verified Photos
            </span>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-3 py-1 border border-emerald-500/30">
              {spaceKeys.length} Dedicated Spaces
            </span>
          </div>
        </div>

        {/* Space Category Filter Tabs */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-emerald-900 text-white shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:bg-slate-200"
            }`}
          >
            <span>All Spaces</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">{photos.length}</span>
          </button>

          {spaceKeys.map((space) => {
            const Icon = SPACE_ICON_MAP[space] || Sofa;
            const count = spacesGrouped.get(space)?.length || 0;
            const isActive = activeTab === space;
            return (
              <button
                key={space}
                type="button"
                onClick={() => setActiveTab(space)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-emerald-900 text-white shadow-md ring-2 ring-emerald-500/50"
                    : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:bg-slate-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-emerald-300" : "text-emerald-700 dark:text-emerald-400"}`} />
                <span>{space}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Spaces Content Display */}
        {activeTab === "all" ? (
          // Grouped Display of each Space
          <div className="space-y-12">
            {spaceKeys.map((space) => {
              const spacePhotos = spacesGrouped.get(space) || [];
              const Icon = SPACE_ICON_MAP[space] || Sparkles;
              const highlights = getSpaceAttributes(space, roomSpecs, amenities);

              return (
                <div
                  key={space}
                  className="rounded-3xl border border-border/80 bg-slate-50/50 dark:bg-slate-900/40 p-5 sm:p-7 space-y-5"
                >
                  {/* Space Header & Highlights */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-base sm:text-lg">{space}</h4>
                        <p className="text-xs text-muted-foreground">
                          {spacePhotos.length} high-resolution photograph{spacePhotos.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    {/* Room Feature Highlights */}
                    <div className="flex flex-wrap gap-1.5">
                      {highlights.map((h) => (
                        <span
                          key={h}
                          className="flex items-center gap-1 rounded-full bg-white dark:bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-border shadow-xs"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>{h}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Photo Grid for this Space */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {spacePhotos.map((photo) => {
                      const globalIndex = photos.findIndex((p) => p.id === photo.id);

                      return (
                        <div
                          key={photo.id || photo.url}
                          onClick={() => setLightboxIndex(globalIndex)}
                          className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl border border-border bg-slate-200 dark:bg-slate-800 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                        >
                          <Image
                            src={photo.url}
                            alt={photo.alt || `${propertyName} - ${space}`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                          />

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-between p-4">
                            <div className="self-end">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md">
                                <Maximize2 className="h-3.5 w-3.5" />
                              </span>
                            </div>
                            {photo.caption && (
                              <p className="text-xs font-semibold text-white line-clamp-2">
                                {photo.caption}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Single Selected Space View
          <div className="rounded-3xl border border-border/80 bg-slate-50/50 dark:bg-slate-900/40 p-5 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                  {(() => {
                    const Icon = SPACE_ICON_MAP[activeTab] || Sparkles;
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-base sm:text-lg">{activeTab}</h4>
                  <p className="text-xs text-muted-foreground">
                    {activePhotos.length} photograph{activePhotos.length === 1 ? "" : "s"} of this space
                  </p>
                </div>
              </div>

              {/* Highlights for this Space */}
              <div className="flex flex-wrap gap-1.5">
                {getSpaceAttributes(activeTab, roomSpecs, amenities).map((h) => (
                  <span
                    key={h}
                    className="flex items-center gap-1 rounded-full bg-white dark:bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-border shadow-xs"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{h}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activePhotos.map((photo) => {
                const globalIndex = photos.findIndex((p) => p.id === photo.id);

                return (
                  <div
                    key={photo.id || photo.url}
                    onClick={() => setLightboxIndex(globalIndex)}
                    className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl border border-border bg-slate-200 dark:bg-slate-800 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.alt || `${propertyName} - ${activeTab}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-between p-4">
                      <div className="self-end">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md">
                          <Maximize2 className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      {photo.caption && (
                        <p className="text-xs font-semibold text-white line-clamp-2">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div className="fixed inset-0 z-[1000] flex flex-col bg-black/95 backdrop-blur-xl text-white">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-white">
                {photos[lightboxIndex].spaceTag || "Property Photo"} · {lightboxIndex + 1} of {photos.length}
              </p>
              <p className="text-xs text-slate-400">{propertyName}</p>
            </div>

            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Lightbox Main Image Area */}
          <div className="relative flex-1 flex items-center justify-center p-4">
            <div className="relative h-full w-full max-h-[80vh] max-w-5xl">
              <Image
                src={photos[lightboxIndex].url}
                alt={photos[lightboxIndex].alt || propertyName}
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => (prev! - 1 + photos.length) % photos.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 transition-all active:scale-95"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => (prev! + 1) % photos.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 transition-all active:scale-95"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Caption Footer */}
          {photos[lightboxIndex].caption && (
            <div className="border-t border-white/10 px-6 py-3 text-center text-xs text-slate-300">
              {photos[lightboxIndex].caption}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
