"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { MapPin, Search, Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/booking/date-range-picker";
import { GuestSelector } from "@/components/booking/guest-selector";

export function HeroSearchBar({ cities }: { cities: string[] }) {
  const router = useRouter();
  const [city, setCity] = useState<string>("");
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);
  const [promo, setPromo] = useState("");

  function handleSearch() {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (range?.from) params.set("checkIn", range.from.toISOString());
    if (range?.to) params.set("checkOut", range.to.toISOString());
    params.set("guests", String(guests));
    if (promo) params.set("promo", promo);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="w-full rounded-2xl border border-white/15 bg-white/95 p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:rounded-full sm:p-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.1fr_1.2fr_0.9fr_auto] sm:items-center sm:gap-1">
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="h-14 w-full rounded-xl border-0 bg-transparent px-4 shadow-none focus-visible:ring-0 sm:rounded-full sm:hover:bg-muted/60 [&>span]:flex [&>span]:items-center [&>span]:gap-2">
            <MapPin className="h-4 w-4 text-gold" />
            <SelectValue placeholder="Where to?" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-px bg-border sm:h-9 sm:w-px" />

        <DateRangePicker
          range={range}
          onChange={setRange}
          className="flex h-14 w-full items-center justify-between rounded-xl px-4 text-left text-sm transition-colors hover:bg-muted/60 sm:rounded-full [&>span:first-child]:hidden"
        />

        <div className="h-px bg-border sm:h-9 sm:w-px" />

        <GuestSelector
          guests={guests}
          onChange={setGuests}
          maxGuests={16}
          className="flex h-14 w-full items-center justify-between rounded-xl px-4 text-left text-sm transition-colors hover:bg-muted/60 sm:rounded-full [&>span:first-child]:hidden"
        />

        <Button
          type="button"
          size="xl"
          onClick={handleSearch}
          className="h-14 w-full rounded-xl bg-primary px-8 text-white hover:bg-primary/90 sm:w-auto sm:rounded-full"
        >
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>

      <div className="mt-2 flex items-center gap-2 px-4 pb-1 sm:hidden">
        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
          placeholder="Promo code (optional)"
          className="h-9 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
