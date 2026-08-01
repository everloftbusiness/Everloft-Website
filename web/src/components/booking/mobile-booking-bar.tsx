"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";

export function MobileBookingBar({
  pricePerNight,
  currency,
  targetId,
}: {
  pricePerNight: number;
  currency: string;
  targetId: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-lg font-bold text-primary">{formatCurrency(pricePerNight, currency)}</span>
          <span className="text-sm text-muted-foreground"> / night</span>
        </div>
        <Button
          variant="gold"
          size="xl"
          className="rounded-xl px-8"
          onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" })}
        >
          Book Now
        </Button>
      </div>
    </div>
  );
}
