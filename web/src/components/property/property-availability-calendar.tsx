"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";

type DateRange = {
  startDate: string;
  endDate: string;
};

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function PropertyAvailabilityCalendar({
  propertyId,
  nightlyPrice,
  initialBlockedRanges = [],
}: {
  propertyId?: string;
  nightlyPrice: number | null;
  initialBlockedRanges?: DateRange[];
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [blockedRanges, setBlockedRanges] = useState<DateRange[]>(initialBlockedRanges);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(propertyId));
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) return;

    let isMounted = true;
    async function loadLiveAvailability() {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/properties/${propertyId}/availability`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.blockedRanges)) {
          setBlockedRanges(data.blockedRanges);
        }
      } catch {
        if (isMounted) {
          setFetchError("Unable to load latest calendar availability.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadLiveAvailability();
    return () => {
      isMounted = false;
    };
  }, [propertyId]);

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

  const todayStr = formatYmd(now);

  function isDateBlocked(dateStr: string): boolean {
    if (dateStr < todayStr) return true;
    return blockedRanges.some((b) => {
      const startYmd = (b.startDate || "").slice(0, 10);
      const endYmd = (b.endDate || "").slice(0, 10);
      if (startYmd === endYmd) return dateStr === startYmd;
      return dateStr >= startYmd && dateStr < endYmd;
    });
  }

  function handleDateClick(day: number) {
    const clickedDate = new Date(year, month, day);
    const dateStr = formatYmd(clickedDate);

    if (isDateBlocked(dateStr)) return;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(clickedDate);
      setSelectedEnd(null);
    } else if (selectedStart && !selectedEnd) {
      if (clickedDate < selectedStart) {
        setSelectedStart(clickedDate);
        setSelectedEnd(null);
      } else {
        let hasBlockedBetween = false;
        const cur = new Date(selectedStart);
        while (cur <= clickedDate) {
          if (isDateBlocked(formatYmd(cur))) {
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

  const nights =
    selectedStart && selectedEnd
      ? Math.max(1, Math.round((selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  const basePriceNum = nightlyPrice ?? 0;
  const baseTotal = nights * basePriceNum;
  const gstTax = baseTotal * 0.18;
  const grandTotal = baseTotal + gstTax;

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Select Stay Dates
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Prices include transparent + GST breakdown. Minimum 1 night stay.
          </p>
        </div>

        {nightlyPrice !== null && (
          <div className="flex flex-col items-start sm:items-end">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-foreground tracking-tight">
                {formatCurrency(nightlyPrice)}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">/ night</span>
              <span className="ml-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/20">
                + GST
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">Excludes 18% GST & taxes</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="my-10 flex flex-col items-center justify-center space-y-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 dark:text-amber-400" />
          <p className="text-xs font-medium">Checking live date availability...</p>
        </div>
      ) : fetchError ? (
        <div className="my-8 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center text-xs text-destructive">
          <p>{fetchError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-xs"
            onClick={() => {
              if (propertyId) {
                setIsLoading(true);
                setFetchError(null);
                fetch(`/api/properties/${propertyId}/availability`, { cache: "no-store" })
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.success && Array.isArray(d.blockedRanges)) setBlockedRanges(d.blockedRanges);
                  })
                  .catch(() => setFetchError("Unable to load latest calendar availability."))
                  .finally(() => setIsLoading(false));
              }
            }}
          >
            <RefreshCw className="mr-1 h-3 w-3" /> Retry Loading
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between">
            <h4 className="text-base font-semibold text-foreground">
              {monthNames[month]} {year}
            </h4>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg text-foreground hover:bg-muted"
                onClick={prevMonth}
                disabled={isCurrentOrPastMonth}
                aria-label="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg text-foreground hover:bg-muted"
                onClick={nextMonth}
                aria-label="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-9 w-full" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateObj = new Date(year, month, day);
              const dateStr = formatYmd(dateObj);
              const blocked = isDateBlocked(dateStr);

              const isStart = selectedStart && formatYmd(selectedStart) === dateStr;
              const isEnd = selectedEnd && formatYmd(selectedEnd) === dateStr;
              const isSelectedRange =
                selectedStart &&
                selectedEnd &&
                dateObj > selectedStart &&
                dateObj < selectedEnd;

              let btnStyle = "hover:bg-muted text-foreground";
              if (blocked) {
                btnStyle = "bg-muted/40 text-muted-foreground/40 cursor-not-allowed line-through";
              } else if (isStart || isEnd) {
                btnStyle = "bg-amber-600 text-white font-bold shadow-xs dark:bg-amber-500";
              } else if (isSelectedRange) {
                btnStyle = "bg-amber-500/20 text-amber-900 dark:text-amber-200 font-semibold";
              }

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  disabled={blocked}
                  onClick={() => handleDateClick(day)}
                  className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-medium transition-all ${btnStyle}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </>
      )}

      {selectedStart && (
        <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-muted-foreground">Selected Stay:</span>
              <p className="text-sm font-bold text-foreground">
                {formatYmd(selectedStart)} {selectedEnd ? `➔ ${formatYmd(selectedEnd)}` : "(Select check-out date)"}
              </p>
            </div>
            {selectedEnd && nights > 0 && (
              <div className="text-right">
                <span className="text-xs text-muted-foreground">{nights} Night(s)</span>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(grandTotal)} <span className="text-xs font-normal text-muted-foreground">(inc. GST)</span>
                </p>
              </div>
            )}
          </div>

          {selectedEnd && (
            <div className="mt-4 pt-4 border-t border-border/60 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Base Fare ({nights} night(s) × {formatCurrency(basePriceNum)})</span>
                <span className="font-mono text-foreground">{formatCurrency(baseTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST & Taxes (18%)</span>
                <span className="font-mono text-foreground">{formatCurrency(gstTax)}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/40">
                <span>Total (inc. GST)</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
