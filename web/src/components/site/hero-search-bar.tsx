"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { MapPin, Search, Calendar, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/booking/date-range-picker";
import { GuestSelector } from "@/components/booking/guest-selector";

export function HeroSearchBar({ cities }: { cities: string[] }) {
  const router = useRouter();
  const [city, setCity] = useState<string>("");
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);

  function handleSearch() {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (range?.from) params.set("checkIn", range.from.toISOString());
    if (range?.to) params.set("checkOut", range.to.toISOString());
    params.set("guests", String(guests));
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="w-full rounded-2xl sm:rounded-full border border-white/20 bg-white/95 p-2 sm:p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.3fr_auto_1.4fr_auto_1fr_auto] sm:items-center">
        {/* City Selector */}
        <div className="flex flex-col px-3 py-1">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Where are you going?
          </span>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="h-9 w-full border-0 bg-transparent p-0 text-sm font-medium text-foreground shadow-none focus-visible:ring-0 [&>span]:flex [&>span]:items-center [&>span]:gap-2">
              <MapPin className="h-4 w-4 text-emerald-700 shrink-0" />
              <SelectValue placeholder="All Destinations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Destinations</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden h-10 w-px bg-border sm:block" />

        {/* Date Picker */}
        <div className="flex flex-col px-3 py-1">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Check-in / Check-out
          </span>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-700 shrink-0" />
            <DateRangePicker
              range={range}
              onChange={setRange}
              className="h-9 w-full border-0 bg-transparent p-0 text-left text-sm font-medium transition-colors focus-visible:ring-0 [&>span:first-child]:hidden"
            />
          </div>
        </div>

        <div className="hidden h-10 w-px bg-border sm:block" />

        {/* Guests Selector */}
        <div className="flex flex-col px-3 py-1">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Guests
          </span>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-700 shrink-0" />
            <GuestSelector
              guests={guests}
              onChange={setGuests}
              maxGuests={16}
              className="h-9 w-full border-0 bg-transparent p-0 text-left text-sm font-medium transition-colors focus-visible:ring-0 [&>span:first-child]:hidden"
            />
          </div>
        </div>

        {/* Search CTA */}
        <Button
          type="button"
          size="lg"
          onClick={handleSearch}
          className="h-12 w-full rounded-xl sm:rounded-full bg-emerald-900 hover:bg-emerald-950 text-white font-semibold px-7 shadow-md transition-all hover:scale-[1.02] sm:w-auto"
        >
          <Search className="h-4 w-4 mr-2" />
          Search Stays
        </Button>
      </div>
    </div>
  );
}
