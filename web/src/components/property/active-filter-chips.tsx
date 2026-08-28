"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export function ActiveFilterChips({ maxPriceFloor }: { maxPriceFloor?: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const city = searchParams.get("city");
  const type = searchParams.get("type");
  const guests = searchParams.get("guests");
  const bedrooms = searchParams.get("bedrooms");
  const maxPriceParam = searchParams.get("maxPrice");
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : null;
  const amenities = searchParams.get("amenities")?.split(",").filter(Boolean) ?? [];

  const hasActiveFilters = Boolean(
    city || type || guests || bedrooms || (maxPrice && maxPriceFloor && maxPrice < maxPriceFloor) || amenities.length > 0
  );

  if (!hasActiveFilters) return null;

  function removeFilter(key: string, valueToRemove?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "amenities" && valueToRemove) {
      const remaining = amenities.filter((a) => a !== valueToRemove);
      if (remaining.length > 0) params.set("amenities", remaining.join(","));
      else params.delete("amenities");
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/properties?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams();
    const sort = searchParams.get("sort");
    const view = searchParams.get("view");
    if (sort) params.set("sort", sort);
    if (view) params.set("view", view);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-3 pb-1">
      <span className="text-xs font-semibold text-muted-foreground mr-1">Active Filters:</span>

      {city && (
        <button
          type="button"
          onClick={() => removeFilter("city")}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 px-3 py-1 text-xs font-semibold hover:bg-emerald-200 transition-colors"
        >
          <span>City: {city}</span>
          <X className="h-3 w-3 shrink-0" />
        </button>
      )}

      {type && (
        <button
          type="button"
          onClick={() => removeFilter("type")}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 px-3 py-1 text-xs font-semibold hover:bg-emerald-200 transition-colors"
        >
          <span>Type: {type}</span>
          <X className="h-3 w-3 shrink-0" />
        </button>
      )}

      {guests && (
        <button
          type="button"
          onClick={() => removeFilter("guests")}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 px-3 py-1 text-xs font-semibold hover:bg-emerald-200 transition-colors"
        >
          <span>Guests: {guests}+</span>
          <X className="h-3 w-3 shrink-0" />
        </button>
      )}

      {bedrooms && (
        <button
          type="button"
          onClick={() => removeFilter("bedrooms")}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 px-3 py-1 text-xs font-semibold hover:bg-emerald-200 transition-colors"
        >
          <span>Bedrooms: {bedrooms}+</span>
          <X className="h-3 w-3 shrink-0" />
        </button>
      )}

      {maxPrice && maxPriceFloor && maxPrice < maxPriceFloor && (
        <button
          type="button"
          onClick={() => removeFilter("maxPrice")}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 px-3 py-1 text-xs font-semibold hover:bg-emerald-200 transition-colors"
        >
          <span>≤ {formatCurrency(maxPrice)}</span>
          <X className="h-3 w-3 shrink-0" />
        </button>
      )}

      {amenities.map((amenity) => (
        <button
          key={amenity}
          type="button"
          onClick={() => removeFilter("amenities", amenity)}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300/60 dark:border-amber-800 text-amber-950 dark:text-amber-300 px-3 py-1 text-xs font-semibold hover:bg-amber-200 transition-colors"
        >
          <span>{amenity}</span>
          <X className="h-3 w-3 shrink-0" />
        </button>
      ))}

      <button
        type="button"
        onClick={clearAll}
        className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline ml-1"
      >
        <RotateCcw className="h-3 w-3" /> Clear All
      </button>
    </div>
  );
}
