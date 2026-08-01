import Image from "next/image";
import { MapPin, Users, BedDouble, Bath } from "lucide-react";

export function LivePreviewCard({
  coverPhotoUrl,
  name,
  city,
  country,
  maxGuests,
  bedrooms,
  bathrooms,
  basePrice,
  currency,
  cleaningFee,
}: {
  coverPhotoUrl: string | null;
  name: string;
  city: string | null;
  country: string;
  maxGuests: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  basePrice: number | null;
  currency: string;
  cleaningFee: number | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <p className="border-b border-border p-4 text-sm font-bold text-primary">Live Listing Preview</p>
      <div className="relative aspect-[4/3] w-full bg-soft">
        {coverPhotoUrl ? (
          <Image src={coverPhotoUrl} alt={name} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No cover photo yet</div>
        )}
      </div>
      <div className="p-4">
        <p className="font-bold text-primary">{name}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {[city, country].filter(Boolean).join(", ")}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {maxGuests ?? "—"} guests
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="h-3 w-3" /> {bedrooms ?? "—"} bedrooms
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3 w-3" /> {bathrooms ?? "—"} baths
          </span>
        </div>
        {basePrice && (
          <p className="mt-3 text-sm font-bold text-primary">
            {currency} {basePrice.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">/ night</span>
          </p>
        )}
        {cleaningFee ? (
          <p className="text-xs text-muted-foreground">
            + {currency} {cleaningFee.toLocaleString()} cleaning fee
          </p>
        ) : null}
      </div>
    </div>
  );
}
