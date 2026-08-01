import Link from "next/link";
import { MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type MapProperty = {
  id: string;
  slug: string;
  name: string;
  currency: string;
  nightlyPrice?: number | null;
  pricePerNight?: number;
};

function pinPosition(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);
  const top = 15 + (Math.abs(hash) % 70);
  const left = 10 + (Math.abs(hash >> 3) % 80);
  return { top: `${top}%`, left: `${left}%` };
}

export function PropertyMapPlaceholder({ properties }: { properties: MapProperty[] }) {
  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-2xl border border-border bg-soft">
      <svg className="absolute inset-0 h-full w-full opacity-[0.5]" viewBox="0 0 800 560" aria-hidden>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="800" height="560" fill="url(#grid)" />
        <path d="M0 380 Q200 300 400 360 T800 320" fill="none" stroke="#94a3b8" strokeWidth="2" opacity="0.5" />
      </svg>

      {properties.map((p) => {
        const pos = pinPosition(p.slug);
        const price = p.nightlyPrice ?? p.pricePerNight ?? null;
        return (
          <Link
            key={p.id}
            href="/contact"
            className="group absolute -translate-x-1/2 -translate-y-full"
            style={pos}
          >
            <div className="flex flex-col items-center">
              <span className="whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {p.name} · {price !== null ? formatCurrency(price, p.currency) : "Pricing on request"}
              </span>
              <MapPin
                className="h-8 w-8 text-primary drop-shadow-md transition-transform group-hover:scale-110 group-hover:text-gold"
                fill="currentColor"
                strokeWidth={1}
              />
            </div>
          </Link>
        );
      })}

      <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-3 py-2 text-xs text-muted-foreground shadow">
        Illustrative map — connect Google Maps for live pins.
      </div>
    </div>
  );
}
