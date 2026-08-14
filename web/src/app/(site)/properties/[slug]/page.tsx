import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Bath,
  BedDouble,
  CheckCircle2,
  MapPin,
  Maximize,
  ShieldCheck,
  Users,
  Star,
  Clock,
  Sparkles,
  Phone,
  MessageCircle,
  ArrowRight,
  Home,
  Wifi,
  Utensils,
  Tv,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyGallery } from "@/components/property/property-gallery";
import { Logo } from "@/components/logo";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { formatCurrency } from "@/lib/format";
import { getPublicActivePropertyBySlug, listPublicActiveProperties, PublicPropertyCard } from "@/features/properties";
import { BookingWidget } from "@/components/booking/booking-widget";
import { MobileBookingBar } from "@/components/booking/mobile-booking-bar";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const property = await getPublicActivePropertyBySlug((await params).slug);
  if (!property) return { title: "Property not found" };
  return {
    title: `${property.name}${property.city ? ` — ${property.city}` : ""} | Everloft`,
    description: property.description?.slice(0, 155) ?? `Explore ${property.name}, professionally managed by Everloft.`,
  };
}

export default async function PropertyDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [property, allProperties] = await Promise.all([
    getPublicActivePropertyBySlug(slug),
    listPublicActiveProperties(5).catch(() => []),
  ]);

  if (!property) notFound();

  const location = [property.area, property.city].filter(Boolean).join(", ") || "India";
  const similarStays = allProperties.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <div className="bg-background">
      {/* 1. Breadcrumbs & Header Section */}
      <div className="site-container pt-28 pb-4 text-xs font-medium text-muted-foreground">
        <nav className="flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/properties" className="hover:text-foreground transition-colors">Properties</Link>
          {property.city && (
            <>
              <span>/</span>
              <Link href={`/properties?city=${encodeURIComponent(property.city)}`} className="hover:text-foreground transition-colors">
                {property.city}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-none">{property.name}</span>
        </nav>
      </div>

      <div className="site-container pb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {property.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 font-semibold text-foreground">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span>4.9</span>
                <span className="text-xs text-muted-foreground font-normal">(Verified Stay)</span>
              </div>
              <span>•</span>
              <span className="flex items-center gap-1 text-foreground/80">
                <MapPin className="h-4 w-4 text-emerald-700" />
                {property.address || location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Luxury Bento Gallery & Fullscreen Modal */}
      <PropertyGallery
        images={property.photos}
        type={property.typeName ?? "Curated Stay"}
        name={property.name}
        location={location}
      />

      {/* 3. Main Content Grid (Details on Left + Sticky Booking Sidebar on Right) */}
      <div className="site-container grid gap-12 pb-24 pt-10 lg:grid-cols-[1fr_380px]">
        <main className="space-y-10">
          {/* Key Specs Row */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border/80 bg-card p-5 sm:grid-cols-4 shadow-sm">
            {property.bedrooms !== null && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <BedDouble className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Bedrooms</p>
                  <p className="text-sm font-bold text-foreground">{property.bedrooms} BHK</p>
                </div>
              </div>
            )}

            {property.maxGuests !== null && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Capacity</p>
                  <p className="text-sm font-bold text-foreground">{property.maxGuests} Guests</p>
                </div>
              </div>
            )}

            {property.bathrooms !== null && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <Bath className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Bathrooms</p>
                  <p className="text-sm font-bold text-foreground">{property.bathrooms} Baths</p>
                </div>
              </div>
            )}

            {property.propertyAreaSqft !== null && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <Maximize className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Area</p>
                  <p className="text-sm font-bold text-foreground">{property.propertyAreaSqft.toLocaleString("en-IN")} sqft</p>
                </div>
              </div>
            )}
          </div>

          {/* Operational Management Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-emerald-800/20 bg-gradient-to-r from-emerald-50/60 to-slate-50/60 p-5 shadow-sm">
            <div className="flex items-center gap-3.5">
              <Logo variant="dark" />
              <div>
                <p className="text-sm font-bold text-foreground">Professionally Managed by Everloft</p>
                <p className="text-xs text-muted-foreground">In-house housekeeping, sanitized linens & 24/7 guest concierge support</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-800 px-3 py-1 text-xs font-semibold text-white shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Standard
            </span>
          </div>

          {/* About this property */}
          {property.description && (
            <section className="border-t border-border/80 pt-8">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
                About this stay
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground text-sm sm:text-base whitespace-pre-line">
                {property.description}
              </p>
            </section>
          )}

          {/* Highlights */}
          {property.highlights && property.highlights.length > 0 && (
            <section className="border-t border-border/80 pt-8">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
                Property Highlights
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {property.highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <span className="text-sm font-medium text-foreground">{highlight}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Amenities & Inclusions */}
          {property.amenities && property.amenities.length > 0 && (
            <section className="border-t border-border/80 pt-8">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
                Amenities & Inclusions
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card p-3 text-sm font-medium text-foreground shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                    <span className="line-clamp-1">{amenity}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* House Rules & Policies */}
          <section className="border-t border-border/80 pt-8">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              House Rules & Policies
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5">
                <Clock className="h-4 w-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground block">Check-in</span>
                  <span className="font-semibold text-foreground">2:00 PM onwards</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5">
                <Clock className="h-4 w-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground block">Check-out</span>
                  <span className="font-semibold text-foreground">Until 11:00 AM</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5">
                <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground block">Access</span>
                  <span className="font-semibold text-foreground">Keyless Smart Lock / In-Person</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5">
                <Sparkles className="h-4 w-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground block">Housekeeping</span>
                  <span className="font-semibold text-foreground">Sanitized before every arrival</span>
                </div>
              </div>
            </div>
          </section>

          {/* Location & Address */}
          <section className="border-t border-border/80 pt-8">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Location & Neighbourhood
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {property.address || location}
            </p>
            <div className="mt-4 rounded-2xl border border-border/80 bg-slate-900 p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-base font-bold text-white">Explore around {property.city || "Bangalore"}</p>
                <p className="text-xs text-white/70">Convenient access to dining, shopping centres, and key transit hubs.</p>
              </div>
              <Button asChild size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shrink-0">
                <Link href="/properties?view=map">
                  View Map <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </section>
        </main>

        {/* Right Sticky Booking & Inquiry Card */}
        <aside>
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xl lg:sticky lg:top-28">
            <div className="flex items-baseline justify-between pb-5 border-b border-border/80">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Nightly Rate</span>
                <div className="text-2xl font-bold text-foreground">
                  {property.nightlyPrice !== null ? (
                    <>
                      {formatCurrency(property.nightlyPrice, property.currency)}
                      <span className="text-sm font-normal text-muted-foreground"> / night</span>
                    </>
                  ) : (
                    <span className="text-lg font-medium text-muted-foreground">Rate on request</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 border border-amber-200">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                4.9
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-muted-foreground space-y-1.5">
                <div className="flex items-center justify-between font-medium text-foreground">
                  <span>Transparent Pricing</span>
                  <span className="text-emerald-700 font-bold">Zero Extra Surcharges</span>
                </div>
                <p>Reserve directly with our operations team for seamless check-in support.</p>
              </div>

              {/* Inquiry Action */}
              <Button
                asChild
                size="lg"
                className="w-full rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold h-12 shadow-md"
              >
                <Link href={`/contact?property=${encodeURIComponent(property.name)}`}>
                  Enquire for Availability
                </Link>
              </Button>

              {/* Instant WhatsApp Concierge Button */}
              <a
                href={`https://wa.me/917483270264?text=${encodeURIComponent(`Hi Everloft, I'm interested in booking ${property.name} (${property.city || ""}). Could you share availability and details?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-600/30 bg-emerald-50 text-xs sm:text-sm font-bold text-emerald-900 transition-colors hover:bg-emerald-100/80"
              >
                <MessageCircle className="h-4 w-4 text-emerald-700" />
                Chat with Concierge on WhatsApp
              </a>

              <a
                href="tel:+917483270264"
                className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground pt-1"
              >
                <Phone className="h-3.5 w-3.5 text-emerald-700" />
                Call directly: (+91) 748-327-0264
              </a>
            </div>

            <div className="mt-6 border-t border-border/80 pt-4 space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                Direct coordination with on-ground property manager
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                100% Verified stay with professional housekeeping
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* 4. Similar Curated Stays */}
      {similarStays.length > 0 && (
        <section className="border-t border-border/80 bg-slate-50/60 py-16">
          <div className="site-container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                  Explore More
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mt-1">
                  Similar Curated Stays
                </h3>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/properties">
                  View All <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similarStays.map((stay) => (
                <PublicPropertyCard key={stay.id} property={stay} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Mobile Sticky Booking Bar */}
      <MobileBookingBar
        pricePerNight={property.nightlyPrice}
        currency={property.currency}
        propertyName={property.name}
      />
    </div>
  );
}
