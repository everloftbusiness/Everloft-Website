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

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-700/40 hover:shadow-[0_20px_45px_-15px_rgba(15,23,42,0.18)]">
      {/* Image container */}
      <div className="relative block aspect-[16/10] overflow-hidden bg-muted">
        <Link href={`/properties/${property.slug}`} className="block h-full w-full">
          {property.coverImageUrl && !imgError ? (
            <Image
              src={property.coverImageUrl}
              alt={property.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <PropertyMedia seed={property.id} type={typeName} label={property.name} />
          )}
        </Link>

        {/* Top Badges */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm backdrop-blur-md">
            <Sparkles className="h-3 w-3" />
            {typeName}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
            aria-label="Add to wishlist"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-transform hover:scale-110 hover:bg-black/60 active:scale-95"
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/properties/${property.slug}`}
            className="line-clamp-1 font-serif text-lg font-bold text-foreground transition-colors hover:text-emerald-800"
          >
            {property.name}
          </Link>
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
          <span className="line-clamp-1">
            {property.area ? `${property.area}, ` : ""}{property.city ?? "Karnataka, India"}
          </span>
        </p>

        {/* Specs row */}
        <div className="my-3.5 flex flex-wrap items-center gap-3 border-y border-border/60 py-2.5 text-xs text-muted-foreground">
          {property.bedrooms !== null && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5 text-foreground/70" />
              {property.bedrooms} BHK
            </span>
          )}
          {property.maxGuests !== null && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-foreground/70" />
              {property.maxGuests} Guests
            </span>
          )}
          {property.bathrooms !== null && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-foreground/70" />
              {property.bathrooms} Baths
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 font-semibold text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            4.9
          </span>
        </div>

        {/* Price & Action */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <div>
            <span className="text-[11px] text-muted-foreground block">From</span>
            <div className="text-base font-bold text-foreground">
              {property.nightlyPrice !== null ? (
                <>
                  {formatCurrency(property.nightlyPrice, property.currency)}
                  <span className="text-xs font-normal text-muted-foreground"> / night</span>
                </>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">Pricing on request</span>
              )}
            </div>
          </div>

          <Button
            asChild
            size="sm"
            className="rounded-full bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-medium px-4 h-9 shadow-sm"
          >
            <Link href={`/properties/${property.slug}`}>
              View Stay
            </Link>
          </Button>
        </div>

        {/* Trust badge */}
        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50/80 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Professionally Managed • Verified Standards
        </div>
      </div>
    </article>
  );
}
