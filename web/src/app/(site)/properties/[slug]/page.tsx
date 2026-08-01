import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bath, BedDouble, CheckCircle2, MapPin, Maximize, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyGallery } from "@/components/property/property-gallery";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/motion/reveal";
import { formatCurrency } from "@/lib/format";
import { getPublicActivePropertyBySlug } from "@/features/properties";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const property = await getPublicActivePropertyBySlug((await params).slug);
  if (!property) return { title: "Property not found" };
  return {
    title: `${property.name}${property.city ? ` — ${property.city}` : ""}`,
    description: property.description?.slice(0, 155) ?? `Explore ${property.name}, professionally managed by Everloft.`,
  };
}

export default async function PropertyDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const property = await getPublicActivePropertyBySlug((await params).slug);
  if (!property) notFound();

  const location = [property.area, property.city].filter(Boolean).join(", ") || "India";

  return (
    <>
      <div className="site-container pt-28 pb-6 text-sm text-muted-foreground">
        <Link href="/properties" className="hover:text-primary">Properties</Link> <span className="mx-2">/</span> {property.name}
      </div>

      <PropertyGallery images={property.photos} type={property.typeName ?? "Everloft stay"} name={property.name} />

      <div className="site-container grid gap-12 pb-24 pt-10 lg:grid-cols-[1fr_360px]">
        <main>
          <Reveal>
            <span className="inline-block rounded-full bg-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {property.typeName ?? "Everloft stay"}
            </span>
            <h1 className="heading-display mt-3 text-3xl sm:text-4xl">{property.name}</h1>
            <p className="mt-3 flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" /> {property.address ?? location}</p>
          </Reveal>

          <Reveal className="flex flex-wrap gap-x-9 gap-y-4 border-y border-border py-7 text-sm">
            {property.maxGuests !== null && <span className="flex items-center gap-2 font-medium text-primary"><Users className="h-4 w-4 text-gold" /> {property.maxGuests} guests</span>}
            {property.bedrooms !== null && <span className="flex items-center gap-2 font-medium text-primary"><BedDouble className="h-4 w-4 text-gold" /> {property.bedrooms} bedrooms</span>}
            {property.bathrooms !== null && <span className="flex items-center gap-2 font-medium text-primary"><Bath className="h-4 w-4 text-gold" /> {property.bathrooms} bathrooms</span>}
            {property.propertyAreaSqft !== null && <span className="flex items-center gap-2 font-medium text-primary"><Maximize className="h-4 w-4 text-gold" /> {property.propertyAreaSqft.toLocaleString("en-IN")} sqft</span>}
          </Reveal>

          {property.description && <Reveal className="border-b border-border py-8"><h2 className="mb-4 text-xl font-bold text-primary">About this property</h2><p className="leading-relaxed text-muted-foreground">{property.description}</p></Reveal>}

          {property.highlights.length > 0 && <Reveal className="border-b border-border py-8"><h2 className="mb-5 text-xl font-bold text-primary">Highlights</h2><div className="grid gap-3 sm:grid-cols-2">{property.highlights.map((highlight) => <p key={highlight} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{highlight}</p>)}</div></Reveal>}

          {property.amenities.length > 0 && <Reveal className="border-b border-border py-8"><h2 className="mb-5 text-xl font-bold text-primary">Amenities</h2><div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">{property.amenities.map((amenity) => <p key={amenity} className="flex gap-2 text-sm text-foreground/85"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />{amenity}</p>)}</div></Reveal>}

          <Reveal className="pt-8"><div className="flex items-center gap-4 rounded-2xl border border-border bg-soft p-6"><Logo /><div><p className="font-semibold text-primary">Managed by Everloft</p><p className="flex items-center gap-1.5 text-sm text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> Professionally managed and verified</p></div></div></Reveal>
        </main>

        <aside><div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-28"><p className="text-sm text-muted-foreground">From</p><p className="mt-1 text-2xl font-bold text-primary">{property.nightlyPrice !== null ? formatCurrency(property.nightlyPrice, property.currency) : "Pricing on request"}{property.nightlyPrice !== null && <span className="text-sm font-normal text-muted-foreground"> / night</span>}</p><Button asChild variant="gold" size="xl" className="mt-6 w-full rounded-xl"><Link href="/contact">Enquire about this stay</Link></Button></div></aside>
      </div>
    </>
  );
}
