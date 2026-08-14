"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Grid,
  Maximize2,
  Share2,
  Heart,
  Sparkles,
  MapPin,
  Check,
  Video,
} from "lucide-react";
import { PropertyMedia } from "@/components/media/property-media";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  id?: string;
  url: string;
  alt?: string;
  caption?: string | null;
  spaceTag?: string | null;
  isCover?: boolean;
};

export type GalleryVideo = {
  id: string;
  url: string;
  videoType: string;
  caption: string | null;
};

function getSpaceRank(spaceTag: string | null | undefined): number {
  if (!spaceTag) return 999;
  const tag = spaceTag.toLowerCase().trim();
  if (tag.includes("living")) return 10;
  if (tag.startsWith("bedroom 1")) return 20;
  if (tag.startsWith("bedroom 2")) return 21;
  if (tag.startsWith("bedroom 3")) return 22;
  if (tag.startsWith("bedroom 4")) return 23;
  if (tag.startsWith("bedroom 5")) return 24;
  if (tag.startsWith("bedroom")) return 29;
  if (tag.includes("kitchen")) return 30;
  if (tag.includes("dining")) return 35;
  if (tag.startsWith("bathroom 1")) return 40;
  if (tag.startsWith("bathroom 2")) return 41;
  if (tag.startsWith("bathroom 3")) return 42;
  if (tag.startsWith("bathroom")) return 49;
  if (tag.includes("balcony")) return 50;
  if (tag.includes("terrace") || tag.includes("rooftop")) return 55;
  if (tag.includes("pool") || tag.includes("swimming") || tag.includes("jacuzzi")) return 60;
  if (tag.includes("garden") || tag.includes("lawn")) return 65;
  if (tag.includes("entertainment") || tag.includes("game")) return 70;
  if (tag.includes("gym") || tag.includes("fitness")) return 75;
  if (tag.includes("work") || tag.includes("study") || tag.includes("workspace")) return 80;
  if (tag.includes("parking") || tag.includes("car")) return 85;
  if (tag.includes("laundry") || tag.includes("utility")) return 90;
  if (tag.includes("exterior") || tag.includes("entrance")) return 95;
  if (tag.includes("view") || tag.includes("surrounding")) return 100;
  return 150;
}

export function PropertyGallery({
  images,
  videos,
  type,
  name,
  location,
}: {
  images: GalleryImage[];
  videos?: GalleryVideo[];
  type: string;
  name: string;
  location?: string;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"slideshow" | "grid">("slideshow");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sort photos into natural architectural flow: Cover -> Living Room -> Bedroom 1 -> Bedroom 2 -> Kitchen -> Dining -> Bathrooms -> Outdoor/Pool -> Exterior
  const sortedImages = useMemo(() => {
    if (!images || images.length === 0) return [];
    return [...images].sort((a, b) => {
      // 1. Cover photo always first
      if (a.isCover && !b.isCover) return -1;
      if (!a.isCover && b.isCover) return 1;

      // 2. Space category sequence
      const rankA = getSpaceRank(a.spaceTag);
      const rankB = getSpaceRank(b.spaceTag);
      if (rankA !== rankB) return rankA - rankB;

      return 0;
    });
  }, [images]);

  const displayImages = sortedImages.length > 0 ? sortedImages : images;

  // Safe fallback if images array is empty
  const hasImages = displayImages && displayImages.length > 0;
  const totalPhotos = hasImages ? displayImages.length : 1;

  const nextPhoto = useCallback(() => {
    if (!hasImages) return;
    setActiveIndex((prev) => (prev + 1) % displayImages.length);
  }, [hasImages, displayImages.length]);

  const prevPhoto = useCallback(() => {
    if (!hasImages) return;
    setActiveIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  }, [hasImages, displayImages.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "Escape") setLightboxOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, nextPhoto, prevPhoto]);

  // Prevent background scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [lightboxOpen]);

  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function openAt(index: number) {
    setActiveIndex(index);
    setViewMode("slideshow");
    setLightboxOpen(true);
  }

  function openGridView() {
    setViewMode("grid");
    setLightboxOpen(true);
  }

  return (
    <div className="site-container">
      {/* Top Action Strip */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs transition-all hover:bg-muted active:scale-95"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="h-3.5 w-3.5 text-muted-foreground" />}
          {copied ? "Link Copied!" : "Share"}
        </button>

        <button
          type="button"
          onClick={() => setIsSaved(!isSaved)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs transition-all hover:bg-muted active:scale-95"
        >
          <Heart className={cn("h-3.5 w-3.5", isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          {isSaved ? "Saved" : "Save"}
        </button>
      </div>

      {/* 5-Photo Luxury Bento Grid */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-slate-900 shadow-md">
        <div className="grid h-[320px] grid-cols-1 gap-2 sm:h-[440px] md:h-[480px] lg:h-[520px] sm:grid-cols-4 sm:grid-rows-2">
          {/* Main Hero Photo (Left 2 cols, 2 rows) */}
          <div
            onClick={() => openAt(0)}
            className="group relative col-span-1 row-span-2 h-full cursor-pointer overflow-hidden sm:col-span-2"
          >
            {hasImages && displayImages[0] ? (
              <Image
                src={displayImages[0].url}
                alt={displayImages[0].alt || name}
                fill
                priority
                unoptimized
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <PropertyMedia seed={name} type={type} label={name} className="h-full w-full" />
            )}
            <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
          </div>

          {/* 4 Secondary Photos (Right side 2x2 grid) */}
          {[1, 2, 3, 4].map((idx) => {
            const img = hasImages && displayImages[idx] ? displayImages[idx] : null;
            return (
              <div
                key={idx}
                onClick={() => openAt(idx < totalPhotos ? idx : 0)}
                className="group relative hidden cursor-pointer overflow-hidden sm:block"
              >
                {img ? (
                  <Image
                    src={img.url}
                    alt={img.alt || `${name} photo ${idx + 1}`}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <PropertyMedia seed={`${name}-${idx}`} type={type} label={name} className="h-full w-full" />
                )}
                <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
              </div>
            );
          })}
        </div>

        {/* Floating "Watch Video Tour" Button (Left) */}
        {videos && videos.length > 0 && (
          <a
            href="#video-tour"
            className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-10 flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/25 bg-slate-950/85 px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all hover:bg-slate-900 active:scale-95"
          >
            <Video className="h-3.5 w-3.5 text-amber-400" />
            <span>Watch Video</span>
          </a>
        )}

        {/* Floating "Show all photos" Pill Button (Right) */}
        <button
          type="button"
          onClick={openGridView}
          className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-10 flex items-center gap-1.5 sm:gap-2 rounded-full border border-black/10 bg-white/95 px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold text-slate-900 shadow-xl backdrop-blur-md transition-all hover:bg-white active:scale-95"
        >
          <Grid className="h-3.5 w-3.5 text-emerald-800" />
          <span>{totalPhotos} Photos</span>
        </button>
      </div>

      {/* PLEASANT LUXURY LIGHTBOX MODAL */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/70 backdrop-blur-2xl text-slate-900 animate-in fade-in duration-200">
          {/* Top Lightbox Header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/20 bg-white/90 backdrop-blur-xl px-4 sm:px-8 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-emerald-50 px-3.5 py-1 font-mono text-xs font-bold text-emerald-900 border border-emerald-200">
                {viewMode === "slideshow" ? `${activeIndex + 1} of ${totalPhotos}` : `${totalPhotos} Photos`}
              </span>
              <span className="hidden text-sm font-bold text-foreground md:inline-block line-clamp-1">
                {name} {location ? `• ${location}` : ""}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Toggle Grid vs Slideshow */}
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "slideshow" ? "grid" : "slideshow")}
                className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50 hover:scale-105 active:scale-95"
              >
                <Grid className="h-4 w-4 text-emerald-700" />
                <span className="hidden sm:inline">{viewMode === "slideshow" ? "View All Photos" : "Back to Slideshow"}</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition-all hover:bg-slate-100 hover:scale-105 active:scale-95"
                aria-label="Close gallery"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* View Mode: SLIDESHOW */}
          {viewMode === "slideshow" && (
            <div className="relative flex flex-1 flex-col justify-between overflow-hidden p-3 sm:p-6 bg-gradient-to-b from-slate-900/10 to-slate-900/40">
              {/* Main Photo Viewport */}
              <div className="relative flex flex-1 items-center justify-center">
                {/* Previous Button */}
                {hasImages && displayImages.length > 1 && (
                  <button
                    type="button"
                    onClick={prevPhoto}
                    aria-label="Previous photo"
                    className="absolute left-2 sm:left-6 z-20 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-2xl backdrop-blur-md transition-all hover:bg-white hover:scale-110 active:scale-95 border border-slate-200/80"
                  >
                    <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8 text-slate-800" />
                  </button>
                )}

                {/* Pleasant Photo Frame Card */}
                <div className="relative h-[58vh] sm:h-[68vh] lg:h-[72vh] w-full max-w-6xl rounded-3xl bg-white p-2 sm:p-4 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.35)] border border-white/80 flex items-center justify-center overflow-hidden">
                  {hasImages && displayImages[activeIndex] ? (
                    <Image
                      src={displayImages[activeIndex].url}
                      alt={displayImages[activeIndex].alt || `${name} photo ${activeIndex + 1}`}
                      fill
                      priority
                      unoptimized
                      className="object-contain rounded-2xl"
                    />
                  ) : (
                    <PropertyMedia seed={name} type={type} label={name} className="h-full w-full rounded-2xl" />
                  )}
                </div>

                {/* Next Button */}
                {hasImages && displayImages.length > 1 && (
                  <button
                    type="button"
                    onClick={nextPhoto}
                    aria-label="Next photo"
                    className="absolute right-2 sm:right-6 z-20 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-2xl backdrop-blur-md transition-all hover:bg-white hover:scale-110 active:scale-95 border border-slate-200/80"
                  >
                    <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8 text-slate-800" />
                  </button>
                )}
              </div>

              {/* Bottom Thumbnail Strip on Pleasant Light Bar */}
              {hasImages && displayImages.length > 1 && (
                <div className="mt-3 mx-auto flex h-20 max-w-4xl shrink-0 items-center justify-center gap-2.5 overflow-x-auto rounded-2xl bg-white/85 p-2 shadow-lg backdrop-blur-md border border-white/60">
                  {displayImages.map((img, i) => (
                    <button
                      key={img.url + i}
                      type="button"
                      onClick={() => setActiveIndex(i)}
                      className={cn(
                        "relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
                        activeIndex === i
                          ? "border-emerald-700 ring-2 ring-emerald-700 scale-105 opacity-100 shadow-md"
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <Image
                        src={img.url}
                        alt={`Thumbnail ${i + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* View Mode: FULL PHOTO GRID */}
          {viewMode === "grid" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#FBFBF9]">
              <div className="mx-auto max-w-6xl">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-foreground">Property Photo Gallery</h3>
                    <p className="text-sm text-muted-foreground">Viewing all {totalPhotos} curated photos of {name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode("slideshow")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-950"
                  >
                    Open Slideshow
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {displayImages.map((img, idx) => (
                    <div
                      key={img.url + idx}
                      onClick={() => {
                        setActiveIndex(idx);
                        setViewMode("slideshow");
                      }}
                      className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl border border-border/80 bg-white p-2 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-700/40"
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-100">
                        <Image
                          src={img.url}
                          alt={img.alt || `${name} photo ${idx + 1}`}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute bottom-4 left-4 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded-md bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                          Photo {idx + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
