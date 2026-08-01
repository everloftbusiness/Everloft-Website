"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { AMENITY_TAGS } from "@/lib/data/amenity-tags";
import { formatCurrency } from "@/lib/format";

const ANY = "any";

export function PropertyFilters({
  cities,
  types,
  maxPrice,
  onApplied,
}: {
  cities: string[];
  types: string[];
  maxPrice: number;
  onApplied?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") ?? ANY);
  const [type, setType] = useState(searchParams.get("type") ?? ANY);
  const [guests, setGuests] = useState(searchParams.get("guests") ?? ANY);
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") ?? ANY);
  const [price, setPrice] = useState<number[]>([
    Number(searchParams.get("maxPrice")) || maxPrice,
  ]);
  const [amenities, setAmenities] = useState<string[]>(
    searchParams.get("amenities")?.split(",").filter(Boolean) ?? []
  );

  function toggleAmenity(tag: string) {
    setAmenities((prev) =>
      prev.includes(tag) ? prev.filter((a) => a !== tag) : [...prev, tag]
    );
  }

  function apply() {
    const params = new URLSearchParams();
    if (city !== ANY) params.set("city", city);
    if (type !== ANY) params.set("type", type);
    if (guests !== ANY) params.set("guests", guests);
    if (bedrooms !== ANY) params.set("bedrooms", bedrooms);
    if (price[0] < maxPrice) params.set("maxPrice", String(price[0]));
    if (amenities.length > 0) params.set("amenities", amenities.join(","));
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    router.push(`/properties?${params.toString()}`);
    onApplied?.();
  }

  function reset() {
    setCity(ANY);
    setType(ANY);
    setGuests(ANY);
    setBedrooms(ANY);
    setPrice([maxPrice]);
    setAmenities([]);
    router.push("/properties");
    onApplied?.();
  }

  return (
    <div className="space-y-7">
      <div>
        <Label className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          City
        </Label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any city" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any city</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Property Type
        </Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any type</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Guests
          </Label>
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {[2, 4, 6, 8, 10, 12].map((g) => (
                <SelectItem key={g} value={String(g)}>
                  {g}+
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Bedrooms
          </Label>
          <Select value={bedrooms} onValueChange={setBedrooms}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {[1, 2, 3, 4, 5, 6].map((b) => (
                <SelectItem key={b} value={String(b)}>
                  {b}+
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Max price / night
          </Label>
          <span className="text-sm font-semibold text-primary">
            {formatCurrency(price[0])}
          </span>
        </div>
        <Slider
          value={price}
          onValueChange={setPrice}
          min={10000}
          max={maxPrice}
          step={1000}
        />
      </div>

      <div>
        <Label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Amenities
        </Label>
        <div className="space-y-2.5">
          {AMENITY_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-2.5 text-sm text-foreground/80">
              <Checkbox
                checked={amenities.includes(tag)}
                onCheckedChange={() => toggleAmenity(tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={apply} className="flex-1 rounded-full" variant="gold">
          Apply Filters
        </Button>
        <Button onClick={reset} variant="outline" className="rounded-full">
          Reset
        </Button>
      </div>
    </div>
  );
}
