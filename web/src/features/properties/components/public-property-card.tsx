"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, MapPin, Users, Heart, Star, Sparkles } from "lucide-react";
import { PropertyMedia } from "@/components/media/property-media";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { PublicPropertyListItem } from "@/features/properties/types/property.types";

export function PublicPropertyCard({ property }: { property: PublicPropertyListItem }) {
  const [imgError, setImgError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const typeName = property.typeName ?? "Curated Stay";

  const displayImageUrl = property.thumbnailUrl || property.coverImageUrl;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-700/40 hover:shadow-[0_20px_45px_-15px_rgba(15,23,42,0.18)]">
      {/* Image container */}
      <div className="relative block aspect-[16/10] min-h-[210px] sm:min-h-[190px] overflow-hidden bg-slate-100 dark:bg-slate-850">
        <Link href={`/properties/${property.slug}`} className="block h-full w-full">
          {displayImageUrl && !imgError ? (
            <Image
              src={displayImageUrl}
              alt={property.name}
              fill
              unoptimized
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImgError(true)}
            />
          ) : (
            <PropertyMedia seed={property.slug || property.id} type={typeName} label={property.name} />
          )}
        </Link>

        {/* Top Badges */}
        <div className="absolute inset-x-3.5 top-3.5 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/85 px-3 py-1 text-xs font-bold tracking-wide text-white shadow-md backdrop-blur-md border border-white/20">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            {typeName}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
            aria-label="Add to wishlist"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-md transition-transform hover:scale-110 hover:bg-slate-950/90 active:scale-95 border border-white/10"
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/properties/${property.slug}`}
            className="line-clamp-1 font-serif text-lg sm:text-xl font-bold text-foreground transition-colors hover:text-emerald-800"
          >
            {property.name}
          </Link>
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-emerald-700 shrink-0" />
          <span className="line-clamp-1">
            {property.area ? `${property.area}, ` : ""}{property.city ?? "Karnataka, India"}
          </span>
        </p>

        {/* Specs row */}
        <div className="my-3 flex flex-wrap items-center gap-3 border-y border-border/60 py-2.5 text-xs sm:text-sm text-muted-foreground">
          {property.bedrooms !== null && (
            <span className="flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-foreground/70" />
              {property.bedrooms} BHK
            </span>
          )}
          {property.maxGuests !== null && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-foreground/70" />
              {property.maxGuests} Guests
            </span>
          )}
          {property.bathrooms !== null && (
            <span className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-foreground/70" />
              {property.bathrooms} Baths
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            4.95
          </span>
        </div>

        {/* Price & Action */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground block uppercase tracking-wider">From</span>
            <div className="text-base sm:text-lg lg:text-xl font-extrabold text-foreground">
              {property.nightlyPrice !== null ? (
                <>
                  {formatCurrency(property.nightlyPrice, property.currency)}
                  <span className="text-[11px] sm:text-xs font-normal text-muted-foreground"> / night <span className="font-bold text-emerald-800 dark:text-emerald-400">+ GST</span></span>
                </>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">Pricing on request</span>
              )}
            </div>
            <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400">Book Direct & Save more!</p>
          </div>

          <Button
            asChild
            size="sm"
            className="rounded-full bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold px-4 h-9 shadow-sm shrink-0"
          >
            <Link href={`/properties/${property.slug}`}>
              View Stay
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
