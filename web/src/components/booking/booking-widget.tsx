"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/booking/date-range-picker";
import { GuestSelector } from "@/components/booking/guest-selector";
import { formatCurrency, nightsBetween } from "@/lib/format";

export function BookingWidget({
  slug,
  pricePerNight,
  cleaningFee,
  serviceFeePct,
  currency,
  rating,
  reviewCount,
  maxGuests,
  className,
}: {
  slug: string;
  pricePerNight: number;
  cleaningFee: number;
  serviceFeePct: number;
  currency: string;
  rating: number;
  reviewCount: number;
  maxGuests: number;
  className?: string;
}) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);

  const nights = range?.from && range?.to ? nightsBetween(range.from, range.to) : 0;
  const subtotal = nights * pricePerNight;
  const serviceFee = useMemo(() => Math.round(subtotal * serviceFeePct), [subtotal, serviceFeePct]);
  const total = subtotal + (nights > 0 ? cleaningFee : 0) + serviceFee;

  function handleBook() {
    const params = new URLSearchParams();
    if (range?.from) params.set("checkIn", range.from.toISOString());
    if (range?.to) params.set("checkOut", range.to.toISOString());
    params.set("guests", String(guests));
    router.push(`/booking/${slug}?${params.toString()}`);
  }

  return (
    <div className={`rounded-2xl border border-border bg-card p-6 shadow-[0_24px_60px_-25px_rgba(15,23,42,0.3)] ${className ?? ""}`}>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold text-primary">{formatCurrency(pricePerNight, currency)}</span>
          <span className="text-sm text-muted-foreground"> / night <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">+ GST</span></span>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold text-primary">
          <Star className="h-4 w-4 fill-gold text-gold" />
          {rating.toFixed(2)}
          <span className="font-normal text-muted-foreground">({reviewCount})</span>
        </div>
      </div>

      <div className="space-y-2.5">
        <DateRangePicker range={range} onChange={setRange} />
        <GuestSelector guests={guests} onChange={setGuests} maxGuests={maxGuests} />
      </div>

      <Button
        size="xl"
        variant="gold"
        className="mt-5 w-full rounded-xl"
        onClick={handleBook}
        disabled={!range?.from || !range?.to}
      >
        {range?.from && range?.to ? "Book Now" : "Check Availability"}
      </Button>

      {nights > 0 && (
        <div className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>
              {formatCurrency(pricePerNight, currency)} × {nights} {nights === 1 ? "night" : "nights"}
            </span>
            <span>{formatCurrency(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Cleaning fee</span>
            <span>{formatCurrency(cleaningFee, currency)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Service fee</span>
            <span>{formatCurrency(serviceFee, currency)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>GST & Taxes (18%)</span>
            <span>{formatCurrency(Math.round(subtotal * 0.18), currency)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-bold text-primary">
            <span>Total (inc. GST)</span>
            <span>{formatCurrency(total + Math.round(subtotal * 0.18), currency)}</span>
          </div>
        </div>
      )}

      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-gold" />
        Secure booking, direct with Everloft
      </p>
    </div>
  );
}
