"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, MapPin, Star, Users, BedDouble, Bath } from "lucide-react";
import { PropertyMedia } from "@/components/media/property-media";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PropertyView } from "@/lib/properties";

export function PropertyCard({
  property,
  className,
}: {
  property: Pick<
    PropertyView,
    | "slug"
    | "name"
    | "type"
    | "city"
    | "area"
    | "guests"
    | "bedrooms"
    | "bathrooms"
    | "pricePerNight"
    | "currency"
    | "rating"
    | "reviewCount"
    | "heroImage"
  >;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)]",
        className
      )}
    >
      <Link href={`/properties/${property.slug}`} className="relative block aspect-[4/3] overflow-hidden">
        <div className="h-full w-full transition-transform duration-700 group-hover:scale-[1.06]">
          <PropertyMedia seed={property.heroImage} type={property.type} label={property.name} />
        </div>
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary uppercase backdrop-blur">
          {property.type}
        </span>
      </Link>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setSaved((s) => !s);
        }}
        aria-label={saved ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={saved}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary backdrop-blur transition-transform hover:scale-110"
      >
        <Heart className={cn("h-4 w-4", saved && "fill-gold text-gold")} />
      </button>

      <Link href={`/properties/${property.slug}`} className="flex flex-1 flex-col p-5">
        <div className="mb-1.5 flex items-start justify-between gap-3">
          <h3 className="text-[1.05rem] font-bold leading-snug text-primary">{property.name}</h3>
        </div>
        <p className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {property.area ?? property.city}
        </p>

        <div className="mb-5 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> {property.guests} guests
          </span>
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-3.5 w-3.5" /> {property.bedrooms} beds
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="h-3.5 w-3.5" /> {property.bathrooms} baths
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
          <div>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(property.pricePerNight, property.currency)}
            </span>
            <span className="text-xs text-muted-foreground"> / night <span className="font-semibold text-emerald-800 dark:text-emerald-400">+ GST</span></span>
          </div>
          <span className="text-xs text-muted-foreground">{property.reviewCount} reviews</span>
        </div>
      </Link>
    </div>
  );
}
