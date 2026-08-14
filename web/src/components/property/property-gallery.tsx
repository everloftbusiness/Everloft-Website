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

      {/* 5-Photo Luxury Bento Grid (or Single Clean Placeholder Banner if no photos) */}
      {hasImages ? (
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-slate-900 shadow-md">
          <div className="grid h-[320px] grid-cols-1 gap-2 sm:h-[440px] md:h-[480px] lg:h-[520px] sm:grid-cols-4 sm:grid-rows-2">
            {/* Main Hero Photo (Left 2 cols, 2 rows) */}
            <div
              onClick={() => openAt(0)}
              className="group relative col-span-1 row-span-2 h-full cursor-pointer overflow-hidden sm:col-span-2"
            >
              {displayImages[0] && (
                <Image
                  src={displayImages[0].url}
                  alt={displayImages[0].alt || name}
                  fill
                  priority
                  unoptimized
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
            </div>

            {/* 4 Secondary Photos (Right side 2x2 grid) */}
            {[1, 2, 3, 4].map((idx) => {
              const img = displayImages[idx];
              if (!img) return null;
              return (
                <div
                  key={idx}
                  onClick={() => openAt(idx)}
                  className="group relative hidden cursor-pointer overflow-hidden sm:block"
                >
                  <Image
                    src={img.url}
                    alt={img.alt || `${name} photo ${idx + 1}`}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
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
      ) : (
        <div className="relative h-[260px] sm:h-[360px] md:h-[400px] overflow-hidden rounded-3xl border border-border/80 bg-slate-100 dark:bg-slate-850 shadow-md flex items-center justify-center">
          <PropertyMedia label={name} type={type} className="h-full w-full" />
        </div>
      )}

      {/* LUXURY ADAPTIVE LIGHTBOX MODAL */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-2xl text-white animate-in fade-in duration-200 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxOpen(false);
          }}
        >
          {/* Top Lightbox Header */}
          <div className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-8 border-b border-white/10 bg-black/40 backdrop-blur-md z-30">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/15 px-3.5 py-1 font-mono text-xs font-bold text-white border border-white/20 backdrop-blur">
                {viewMode === "slideshow" ? `${activeIndex + 1} / ${totalPhotos}` : `${totalPhotos} Photos`}
              </span>
              {viewMode === "slideshow" && hasImages && displayImages[activeIndex]?.spaceTag && (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30 backdrop-blur">
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  {displayImages[activeIndex].spaceTag}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Grid vs Slideshow */}
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "slideshow" ? "grid" : "slideshow")}
                className="flex h-9 sm:h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 sm:px-4 text-xs font-bold text-white backdrop-blur transition-all hover:bg-white/20 active:scale-95"
              >
                <Grid className="h-4 w-4 text-emerald-400" />
                <span>{viewMode === "slideshow" ? "All Photos" : "Slideshow"}</span>
              </button>

              {/* Share button */}
              <button
                type="button"
                onClick={handleShare}
                className="flex h-9 sm:h-10 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 sm:px-4 text-xs font-semibold text-white backdrop-blur transition-all hover:bg-white/20 active:scale-95"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5 text-white/80" />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition-all hover:bg-white/25 active:scale-95"
                aria-label="Close fullscreen gallery"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* View Mode: SLIDESHOW (Adaptive full-screen view) */}
          {viewMode === "slideshow" && (
            <div
              className="relative flex flex-1 items-center justify-center p-3 sm:p-6 overflow-hidden"
              onClick={(e) => {
                if (e.target === e.currentTarget) setLightboxOpen(false);
              }}
            >
              {/* Previous Button */}
              {hasImages && displayImages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPhoto();
                  }}
                  aria-label="Previous photo"
                  className="absolute left-3 sm:left-8 z-30 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black/60 text-white shadow-2xl backdrop-blur-md transition-all hover:bg-black/80 hover:scale-110 active:scale-95 border border-white/20"
                >
                  <ChevronLeft className="h-7 w-7 text-white" />
                </button>
              )}

              {/* Adaptive Image Viewport */}
              <div className="relative flex flex-col items-center justify-center max-h-[82vh] max-w-[94vw] sm:max-w-[88vw] w-full h-full">
                <div className="relative h-full w-full flex items-center justify-center">
                  {hasImages && displayImages[activeIndex] ? (
                    <div className="relative h-full w-full max-h-[76vh] flex items-center justify-center">
                      <Image
                        src={displayImages[activeIndex].url}
                        alt={displayImages[activeIndex].alt || `${name} photo ${activeIndex + 1}`}
                        fill
                        priority
                        unoptimized
                        className="object-contain drop-shadow-[0_25px_60px_rgba(0,0,0,0.85)] rounded-2xl"
                      />
                    </div>
                  ) : (
                    <div className="h-[400px] w-[600px] max-w-full rounded-2xl overflow-hidden">
                      <PropertyMedia seed={name} type={type} label={name} className="h-full w-full" />
                    </div>
                  )}
                </div>

                {/* Floating Caption / Space Pill */}
                {hasImages && displayImages[activeIndex]?.caption && (
                  <div className="mt-3 inline-flex max-w-xl items-center justify-center rounded-full bg-black/70 px-4 py-1.5 text-center text-xs font-medium text-white/90 backdrop-blur-md border border-white/10 shadow-lg">
                    {displayImages[activeIndex].caption}
                  </div>
                )}
              </div>

              {/* Next Button */}
              {hasImages && displayImages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPhoto();
                  }}
                  aria-label="Next photo"
                  className="absolute right-3 sm:right-8 z-30 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black/60 text-white shadow-2xl backdrop-blur-md transition-all hover:bg-black/80 hover:scale-110 active:scale-95 border border-white/20"
                >
                  <ChevronRight className="h-7 w-7 text-white" />
                </button>
              )}
            </div>
          )}

          {/* View Mode: FULL PHOTO GRID (Masonry style overview) */}
          {viewMode === "grid" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-black/60 backdrop-blur-xl">
              <div className="mx-auto max-w-6xl">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">All Property Photos</h3>
                    <p className="text-xs sm:text-sm text-white/70">Viewing all {totalPhotos} curated photos of {name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode("slideshow")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all"
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
                      className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-2xl"
                    >
                      <Image
                        src={img.url}
                        alt={img.alt || `${name} photo ${idx + 1}`}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded-md bg-black/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                          Photo {idx + 1}
                        </span>
                        {img.spaceTag && (
                          <span className="rounded-md bg-emerald-950/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 border border-emerald-500/30 backdrop-blur">
                            {img.spaceTag}
                          </span>
                        )}
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
