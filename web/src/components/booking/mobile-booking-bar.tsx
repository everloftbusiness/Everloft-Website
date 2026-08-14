"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";

export function MobileBookingBar({
  pricePerNight,
  currency,
  propertyName,
}: {
  pricePerNight: number | null;
  currency: string;
  propertyName: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-white/95 px-4 py-3 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] backdrop-blur-md lg:hidden">
      <div className="site-container flex items-center justify-between gap-3 p-0">
        <div>
          <span className="text-[11px] text-muted-foreground block font-medium">From</span>
          <div className="text-base font-bold text-foreground">
            {pricePerNight !== null ? (
              <>
                {formatCurrency(pricePerNight, currency)}
                <span className="text-xs font-normal text-muted-foreground"> / nt <span className="font-semibold text-emerald-800 dark:text-emerald-400">+ GST</span></span>
              </>
            ) : (
              <span className="text-xs font-medium text-muted-foreground">On request</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/917483270264?text=${encodeURIComponent(`Hi Everloft, I'm inquiring about booking ${propertyName}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm"
            aria-label="WhatsApp Inquiry"
          >
            <MessageCircle className="h-5 w-5" />
          </a>

          <Button
            asChild
            size="lg"
            className="rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold px-5 h-10 text-xs shadow-md"
          >
            <Link href={`/contact?property=${encodeURIComponent(propertyName)}`}>
              Enquire Now
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
