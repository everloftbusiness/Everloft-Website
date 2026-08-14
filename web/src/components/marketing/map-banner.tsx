import Link from "next/link";
import { Map, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MapBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-slate-900 p-8 sm:p-12 text-white shadow-md">
      {/* Background map grid effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
      <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-emerald-700/20 blur-3xl" />

      <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-md">
            <Map className="h-3.5 w-3.5" />
            Interactive Map View
          </span>
          <h3 className="mt-3 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Explore All Properties on Map
          </h3>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            Find the perfect Everloft stay near tech hubs, city centres, and scenic retreats across Bangalore and South India.
          </p>
        </div>

        <Button
          asChild
          size="lg"
          className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-7 shadow-lg shrink-0"
        >
          <Link href="/properties?view=map">
            View on Map <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
