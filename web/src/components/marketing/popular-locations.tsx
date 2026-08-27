import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight, Building2 } from "lucide-react";

export type LocationSummary = {
  city: string;
  count: number;
  image?: string;
};

const CITY_PHOTO_MAP: Record<string, string> = {
  Goa: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
  Bangalore: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
  Udaipur: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
  Jaipur: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  Munnar: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
  Kerala: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
  Gokarna: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
  Mumbai: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
};

export function PopularLocations({ locations }: { locations: LocationSummary[] }) {
  if (!locations || locations.length === 0) return null;

  // Filter exclusively for Bengaluru / Bangalore
  const bangaloreLoc = locations.find((l) =>
    ["Bangalore", "Bengaluru", "Bangalore South", "Electronic City", "Mylasandra"].some((k) =>
      l.city.toLowerCase().includes(k.toLowerCase())
    )
  ) || { city: "Bengaluru", count: locations.reduce((sum, l) => sum + l.count, 0) };

  const photo = CITY_PHOTO_MAP.Bangalore;

  return (
    <div className="max-w-md">
      <Link
        href={`/properties?city=Bangalore`}
        className="group relative flex flex-col justify-end overflow-hidden rounded-3xl border border-border/80 bg-slate-900 p-6 text-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl min-h-[220px]"
      >
        {/* Background Photography */}
        <Image
          src={photo}
          alt="Bengaluru"
          fill
          unoptimized
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-opacity group-hover:opacity-90" />

        <div className="relative z-10">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-amber-400 backdrop-blur-md border border-white/20">
            <Building2 className="h-5 w-5" />
          </div>
          <h4 className="font-serif text-2xl font-bold text-white group-hover:text-amber-300 transition-colors">
            Bengaluru (Bangalore)
          </h4>
          <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-white/90 font-medium">
            <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>{bangaloreLoc.count} {bangaloreLoc.count === 1 ? "Property" : "Properties"} Active</span>
          </p>
        </div>

        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur transition-transform group-hover:scale-110">
          <ArrowRight className="h-4 w-4" />
        </div>
      </Link>
    </div>
  );
}
