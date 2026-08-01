"use client";

import { Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function GuestSelector({
  guests,
  onChange,
  maxGuests,
  className,
}: {
  guests: number;
  onChange: (guests: number) => void;
  maxGuests: number;
  className?: string;
}) {
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
            <Users className="h-4 w-4" />
            Guests
          </span>
          <span className="font-semibold text-primary">
            {guests} {guests === 1 ? "guest" : "guests"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Guests</p>
            <p className="text-xs text-muted-foreground">Max {maxGuests} guests</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              onClick={() => onChange(Math.max(1, guests - 1))}
              disabled={guests <= 1}
              aria-label="Decrease guests"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-4 text-center text-sm font-semibold">{guests}</span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              onClick={() => onChange(Math.min(maxGuests, guests + 1))}
              disabled={guests >= maxGuests}
              aria-label="Increase guests"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
