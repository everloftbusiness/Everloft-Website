"use client";

import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateShort } from "@/lib/format";

export function DateRangePicker({
  range,
  onChange,
  className,
}: {
  range: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}) {
  const label = range?.from
    ? range.to
      ? `${formatDateShort(range.from)} — ${formatDateShort(range.to)}`
      : formatDateShort(range.from)
    : "Select dates";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={
            className ??
            "flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left text-sm transition-colors hover:border-primary/40"
          }
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            Dates
          </span>
          <span className="font-semibold text-primary">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={onChange}
          numberOfMonths={2}
          disabled={{ before: new Date() }}
          defaultMonth={range?.from ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}
