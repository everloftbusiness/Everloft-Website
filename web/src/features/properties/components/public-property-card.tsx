import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, MapPin, Users } from "lucide-react";
import { PropertyMedia } from "@/components/media/property-media";
import { formatCurrency } from "@/lib/format";
import type { PublicPropertyListItem } from "@/features/properties/types/property.types";

export function PublicPropertyCard({ property }: { property: PublicPropertyListItem }) {
  const typeName = property.typeName ?? "Everloft stay";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)]">
      <Link href={`/properties/${property.slug}`} className="relative block aspect-[4/3] overflow-hidden">
        {property.coverImageUrl ? (
          <Image src={property.coverImageUrl} alt={property.name} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" unoptimized />
        ) : (
          <PropertyMedia seed={property.id} type={typeName} label={property.name} />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary backdrop-blur">
          {typeName}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/properties/${property.slug}`} className="text-[1.05rem] font-bold leading-snug text-primary hover:text-gold">{property.name}</Link>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {property.area ?? property.city ?? "India"}
        </p>

        <div className="mb-5 mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {property.maxGuests !== null && <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {property.maxGuests} guests</span>}
          {property.bedrooms !== null && <span className="flex items-center gap-1.5"><BedDouble className="h-3.5 w-3.5" /> {property.bedrooms} beds</span>}
          {property.bathrooms !== null && <span className="flex items-center gap-1.5"><Bath className="h-3.5 w-3.5" /> {property.bathrooms} baths</span>}
        </div>

        <div className="mt-auto border-t border-border pt-4 text-lg font-bold text-primary">
          {property.nightlyPrice !== null ? <>{formatCurrency(property.nightlyPrice, property.currency)} <span className="text-sm font-normal text-muted-foreground">/ night</span></> : "Pricing on request"}
        </div>
      </div>
    </article>
  );
}
