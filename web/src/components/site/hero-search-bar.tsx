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

import { SlidersHorizontal } from "lucide-react";

export function HeroSearchBar({ cities }: { cities: string[] }) {
  const router = useRouter();
  const [city, setCity] = useState<string>("");
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);

  function handleSearch() {
    const params = new URLSearchParams();
    if (city && city !== "all") params.set("city", city);
    if (range?.from) params.set("checkIn", range.from.toISOString());
    if (range?.to) params.set("checkOut", range.to.toISOString());
    params.set("guests", String(guests));
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="w-full">
      {/* MOBILE LUXURY CARD LAYOUT (Matching uploaded reference mockup) */}
      <div className="block sm:hidden overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl text-slate-900">
        <div className="flex flex-col divide-y divide-slate-100">
          {/* Row 1: Destination */}
          <div className="flex items-center gap-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="text-[11px] font-semibold text-slate-500">Where are you going?</span>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="h-7 w-full border-0 bg-transparent p-0 text-sm font-bold text-slate-900 shadow-none focus-visible:ring-0">
                  <SelectValue placeholder="Search city, location or property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Destinations (Bangalore, Goa, Kochi...)</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Check-in / Check-out / Guests (3 Columns matching mockup) */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 py-2.5">
            <div className="flex items-center gap-1.5 pr-1">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-semibold text-slate-500 truncate">Check-in</span>
                <span className="text-[11px] font-bold text-slate-900 truncate">
                  {range?.from ? range.from.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Select date"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-semibold text-slate-500 truncate">Check-out</span>
                <span className="text-[11px] font-bold text-slate-900 truncate">
                  {range?.to ? range.to.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Select date"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pl-1.5">
              <Users className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-semibold text-slate-500 truncate">Guests</span>
                <GuestSelector
                  guests={guests}
                  onChange={setGuests}
                  maxGuests={16}
                  className="h-5 w-full border-0 bg-transparent p-0 text-[11px] font-bold text-slate-900 shadow-none focus-visible:ring-0 [&>span:first-child]:hidden"
                />
              </div>
            </div>
          </div>

          {/* Hidden full date picker triggered inline */}
          <div className="py-1">
            <DateRangePicker
              range={range}
              onChange={setRange}
              className="w-full text-xs font-medium text-emerald-800 bg-emerald-50/70 rounded-xl py-1 px-3 border border-emerald-100"
            />
          </div>
        </div>

        {/* Row 3: Search Stays Full Width Button */}
        <Button
          type="button"
          onClick={handleSearch}
          className="mt-3 h-12 w-full rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-sm shadow-md"
        >
          Search Stays
        </Button>
      </div>

      {/* DESKTOP CAPSULE BAR */}
      <div className="hidden sm:block w-full rounded-full border border-white/25 bg-white/95 p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all">
        <div className="grid grid-cols-[1.3fr_auto_1.4fr_auto_1fr_auto] items-center gap-2">
          {/* City Selector */}
          <div className="flex flex-col px-3.5 py-1">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              Where are you going?
            </span>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-9 w-full border-0 bg-transparent p-0 text-base font-bold text-foreground shadow-none focus-visible:ring-0 [&>span]:flex [&>span]:items-center [&>span]:gap-2">
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

          <div className="h-10 w-px bg-border" />

          {/* Date Picker */}
          <div className="flex flex-col px-3.5 py-1">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              Check-in / Check-out
            </span>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-700 shrink-0" />
              <DateRangePicker
                range={range}
                onChange={setRange}
                className="h-9 w-full border-0 bg-transparent p-0 text-left text-base font-bold transition-colors focus-visible:ring-0 [&>span:first-child]:hidden"
              />
            </div>
          </div>

          <div className="h-10 w-px bg-border" />

          {/* Guests Selector */}
          <div className="flex flex-col px-3.5 py-1">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              Guests
            </span>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-700 shrink-0" />
              <GuestSelector
                guests={guests}
                onChange={setGuests}
                maxGuests={16}
                className="h-9 w-full border-0 bg-transparent p-0 text-left text-base font-bold transition-colors focus-visible:ring-0 [&>span:first-child]:hidden"
              />
            </div>
          </div>

          {/* Search CTA */}
          <Button
            type="button"
            size="lg"
            onClick={handleSearch}
            className="h-12 rounded-full bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-base px-7 shadow-lg transition-all hover:scale-[1.02]"
          >
            <Search className="h-4 w-4 mr-2" />
            Search Stays
          </Button>
        </div>
      </div>
    </div>
  );
}
