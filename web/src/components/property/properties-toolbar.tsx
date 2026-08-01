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

      <div className="flex items-center gap-2">
        <div className="hidden overflow-hidden rounded-full border border-border sm:flex">
          <button
            onClick={() => setView("grid")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors ${
              view === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Grid
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors ${
              view === "map" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Map className="h-3.5 w-3.5" /> Map
          </button>
        </div>

        <Select defaultValue={searchParams.get("sort") ?? "recommended"} onValueChange={setSort}>
          <SelectTrigger className="w-[170px] rounded-full">
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
          variant="outline"
          className="rounded-full lg:hidden"
          onClick={() => setOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
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
