import Link from "next/link";
import { MapPin, ArrowRight, Building2 } from "lucide-react";

export type LocationSummary = {
  city: string;
  count: number;
  image?: string;
};

export function PopularLocations({ locations }: { locations: LocationSummary[] }) {
  if (!locations || locations.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {locations.map((loc) => (
        <Link
          key={loc.city}
          href={`/properties?city=${encodeURIComponent(loc.city)}`}
          className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-border/80 bg-slate-900 p-5 text-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg min-h-[160px]"
        >
          {/* Subtle backdrop overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 transition-opacity group-hover:opacity-90" />
          
          <div className="relative z-10">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-emerald-400 backdrop-blur-md">
              <Building2 className="h-5 w-5" />
            </div>
            <h4 className="font-serif text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
              {loc.city}
            </h4>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/75 font-medium">
              <MapPin className="h-3 w-3 text-amber-400" />
              {loc.count} {loc.count === 1 ? "Property" : "Properties"}
            </p>
          </div>

          <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
