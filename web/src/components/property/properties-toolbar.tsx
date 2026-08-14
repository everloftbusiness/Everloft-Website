"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Map, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PropertyFilters } from "@/components/property/property-filters";

export function PropertiesToolbar({
  resultCount,
  cities,
  types,
  maxPrice,
  view,
}: {
  resultCount: number;
  cities: string[];
  types: string[];
  maxPrice: number;
  view: "grid" | "map";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function setSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "recommended") params.delete("sort");
    else params.set("sort", value);
    router.push(`/properties?${params.toString()}`);
  }

  function setView(value: "grid" | "map") {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "grid") params.delete("view");
    else params.set("view", value);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-primary">{resultCount}</span>{" "}
        {resultCount === 1 ? "property" : "properties"} found
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-full border border-border bg-card shadow-2xs">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold transition-colors ${
              view === "grid" ? "bg-emerald-800 text-white shadow-xs" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Grid
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold transition-colors ${
              view === "map" ? "bg-emerald-800 text-white shadow-xs" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Map className="h-3.5 w-3.5" /> Map
          </button>
        </div>

        <Select defaultValue={searchParams.get("sort") ?? "recommended"} onValueChange={setSort}>
          <SelectTrigger className="w-[140px] sm:w-[170px] rounded-full text-xs sm:text-sm h-8 sm:h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recommended">Recommended</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full lg:hidden h-8 sm:h-9 text-xs font-semibold gap-1.5"
          onClick={() => setOpen(true)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[340px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-8">
            <PropertyFilters
              cities={cities}
              types={types}
              maxPrice={maxPrice}
              onApplied={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
