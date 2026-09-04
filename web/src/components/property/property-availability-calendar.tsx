"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ShieldCheck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { CalendarBlock } from "@/features/properties/services/ical-sync.service";

export function PropertyAvailabilityCalendar({
  nightlyPrice,
  blockedRanges = [],
}: {
  nightlyPrice: number | null;
  blockedRanges?: CalendarBlock[];
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);

  const now = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const isCurrentOrPastMonth =
    year < now.getFullYear() ||
    (year === now.getFullYear() && month <= now.getMonth());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayStr = now.toISOString().split("T")[0];

  function isDateBlocked(dateStr: string): boolean {
    if (dateStr < todayStr) return true; // Past dates blocked
    return blockedRanges.some(
      (b) => dateStr >= b.startDate && dateStr <= b.endDate
    );
  }

  function handleDateClick(day: number) {
    const clickedDate = new Date(year, month, day);
    const dateStr = clickedDate.toISOString().split("T")[0];

    if (isDateBlocked(dateStr)) return;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(clickedDate);
      setSelectedEnd(null);
    } else if (selectedStart && !selectedEnd) {
      if (clickedDate < selectedStart) {
        setSelectedStart(clickedDate);
        setSelectedEnd(null);
      } else {
        // Check if any blocked date exists between start and end
        let hasBlockedBetween = false;
        const cur = new Date(selectedStart);
        while (cur <= clickedDate) {
          if (isDateBlocked(cur.toISOString().split("T")[0])) {
            hasBlockedBetween = true;
            break;
          }
          cur.setDate(cur.getDate() + 1);
        }

        if (hasBlockedBetween) {
          setSelectedStart(clickedDate);
          setSelectedEnd(null);
        } else {
          setSelectedEnd(clickedDate);
        }
      }
    }
  }

  function prevMonth() {
    if (isCurrentOrPastMonth) return;
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  // Compute stay pricing breakdown
  const nights =
    selectedStart && selectedEnd
      ? Math.round(
          (selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 3600 * 24)
        )
      : 0;

  const basePrice = nightlyPrice || 4500;
  const accommodationTotal = nights * basePrice;
  const gstTax = Math.round(accommodationTotal * 0.18);
  const grandTotal = accommodationTotal + gstTax;

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
            Select Availability & Dates
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Green dates are open for instant booking. Gray dates are reserved.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={prevMonth}
            disabled={isCurrentOrPastMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-bold px-2 min-w-[100px] text-center">
            {monthNames[month]} {year}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs mb-2 font-bold text-muted-foreground">
        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty_${i}`} className="h-9 sm:h-11" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const thisDate = new Date(year, month, day);
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const blocked = isDateBlocked(dateStr);

          const isStart = selectedStart && selectedStart.toISOString().split("T")[0] === dateStr;
          const isEnd = selectedEnd && selectedEnd.toISOString().split("T")[0] === dateStr;
          const isInRange =
            selectedStart &&
            selectedEnd &&
            thisDate > selectedStart &&
            thisDate < selectedEnd;

          let btnClass = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200/60 font-semibold";

          if (blocked) {
            btnClass = "bg-slate-100 dark:bg-slate-900/60 text-slate-400 line-through cursor-not-allowed border-transparent";
          } else if (isStart || isEnd) {
            btnClass = "bg-emerald-800 text-white font-bold shadow-sm border-emerald-800";
          } else if (isInRange) {
            btnClass = "bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-200 font-bold border-transparent";
          }

          return (
            <button
              key={day}
              type="button"
              disabled={blocked}
              onClick={() => handleDateClick(day)}
              className={`h-9 sm:h-11 rounded-xl text-xs sm:text-sm flex flex-col items-center justify-center transition-all ${btnClass}`}
            >
              <span>{day}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Stay Summary Card */}
      {selectedStart && (
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Selected Dates: {selectedStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} {selectedEnd ? `→ ${selectedEnd.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}` : "(Select check-out date)"}</span>
              </div>

              {nights > 0 && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  <p>{formatCurrency(basePrice)} × {nights} {nights === 1 ? "night" : "nights"} = <span className="font-semibold text-foreground">{formatCurrency(accommodationTotal)}</span></p>
                  <p>GST &amp; Taxes (18%) = <span className="font-semibold text-foreground">{formatCurrency(gstTax)}</span></p>
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300 pt-1">Total (inc. GST): {formatCurrency(grandTotal)}</p>
                </div>
              )}
            </div>

            <Button
              disabled={!selectedStart || !selectedEnd}
              className="w-full sm:w-auto rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-6 h-10 shadow-sm"
              onClick={() => {
                const checkoutUrl = `/booking?slug=current&start=${selectedStart.toISOString().split("T")[0]}&end=${selectedEnd?.toISOString().split("T")[0]}`;
                window.location.href = checkoutUrl;
              }}
            >
              <Tag className="mr-1.5 h-4 w-4" /> Instant Reserve
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
