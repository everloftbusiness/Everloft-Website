import type { Metadata } from "next";
import Link from "next/link";
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
  Wifi,
  UtensilsCrossed,
  Car,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyVideoTour } from "@/components/property/property-video-tour";
import { PropertySpacesTour } from "@/components/property/property-spaces-tour";
import { PropertyBedroomsShowcase } from "@/components/property/property-bedrooms-showcase";
import { PropertyAmenitiesShowcase } from "@/components/property/property-amenities-showcase";
import { PropertyLocationMap } from "@/components/property/property-location-map";
import { Logo } from "@/components/logo";
import { formatCurrency } from "@/lib/format";
import { getPublicActivePropertyBySlug, listPublicActiveProperties, PublicPropertyCard } from "@/features/properties";
import { MobileBookingBar } from "@/components/booking/mobile-booking-bar";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const property = await getPublicActivePropertyBySlug((await params).slug);
  if (!property) return { title: "Property not found" };
  return {
    title: `${property.name}${property.city ? ` — ${property.city}` : ""} | Everloft Luxury Stays`,
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

  const location = [property.area, property.city, property.state].filter(Boolean).join(", ") || "India";
  const similarStays = allProperties.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <div className="bg-background">
      {/* 1. Breadcrumbs & Header Section */}
      <div className="site-container pt-24 pb-4 text-xs font-medium text-muted-foreground">
        <nav className="flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">Home</Link>
          <span className="text-border">/</span>
          <Link href="/properties" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">Properties</Link>
          {property.city && (
            <>
              <span className="text-border">/</span>
              <Link href={`/properties?city=${encodeURIComponent(property.city)}`} className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
                {property.city}
              </Link>
            </>
          )}
          <span className="text-border">/</span>
          <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-none">{property.name}</span>
        </nav>
      </div>

      <div className="site-container pb-5">
        <div className="flex flex-col gap-2.5">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-foreground leading-tight">
            {property.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              {property.typeName ?? "Curated Stay"}
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Directly Managed by Everloft
            </span>

            <span>•</span>

            <a
              href="#property-location"
              className="flex items-center gap-1 font-medium text-emerald-800 dark:text-emerald-400 hover:underline"
            >
              <MapPin className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>{property.address || location}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Luxury Bento Gallery & Fullscreen Modal */}
      <PropertyGallery
        images={property.photos}
        videos={property.videos}
        type={property.typeName ?? "Curated Stay"}
        name={property.name}
        location={location}
      />

      {/* 3. Main Content Grid (Details on Left + Sticky Booking Sidebar on Right) */}
      <div className="site-container grid gap-12 pb-24 pt-10 lg:grid-cols-[1fr_380px]">
        <main className="space-y-12 min-w-0">
          {/* Key Specs Row */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border/80 bg-card p-5 sm:grid-cols-4 shadow-sm">
            {property.bedrooms !== null && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-emerald-800/20 bg-gradient-to-r from-emerald-50/70 to-slate-50/70 dark:from-emerald-950/40 dark:to-slate-900/40 p-5 shadow-sm">
            <div className="flex items-center gap-3.5">
              <Logo variant="dark" />
              <div>
                <p className="text-sm font-bold text-foreground">Professionally Managed by Everloft</p>
                <p className="text-xs text-muted-foreground">In-house housekeeping, sanitized linens & 24/7 guest concierge support</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-800 dark:bg-emerald-700 px-3 py-1 text-xs font-semibold text-white shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Standard
            </span>
          </div>

          {/* About this property */}
          {property.description && (
            <section className="border-t border-border/80 pt-8">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
                Overview
              </div>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                About This Stay
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground text-sm sm:text-base whitespace-pre-line">
                {property.description}
              </p>
            </section>
          )}

          {/* Highlights */}
          {property.highlights && property.highlights.length > 0 && (
            <section className="border-t border-border/80 pt-8">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
                Key Inclusions
              </div>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Property Highlights
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {property.highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-foreground">{highlight}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. What This Place Offers (Categorized Amenities & Modal) */}
          {property.amenities && property.amenities.length > 0 && (
            <PropertyAmenitiesShowcase
              amenities={property.amenities}
              propertyName={property.name}
            />
          )}

          {/* 5. Where You'll Sleep (Bedrooms Showcase with Bed Types & Amenities) */}
          <PropertyBedroomsShowcase
            bedroomsCount={property.bedrooms}
            roomSpecs={property.roomSpecs}
            photos={property.photos}
            propertyName={property.name}
          />

          {/* 6. Interactive Location Map with Satellite & Direction links */}
          <PropertyLocationMap
            propertyName={property.name}
            address={property.address}
            area={property.area}
            city={property.city}
            state={property.state}
            country={property.country}
            pinCode={property.pinCode}
            latitude={property.latitude}
            longitude={property.longitude}
            googleMapsUrl={property.googleMapsUrl}
          />

          {/* 7. House Rules & Policies (Option 1: Rules at a Glance Badges) */}
          <section className="border-t border-border/80 pt-10">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              Stay Policies
            </div>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              House Rules & Important Information
            </h2>

            {/* Timings */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
                <Clock className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Check-in</span>
                  <span className="font-semibold text-foreground">
                    {property.checkInTime ? `After ${property.checkInTime.slice(0, 5)}` : "After 1:00 PM (13:00)"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
                <Clock className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Check-out</span>
                  <span className="font-semibold text-foreground">
                    {property.checkOutTime ? `Before ${property.checkOutTime.slice(0, 5)}` : "Before 10:00 AM (10:00)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Option 1: Rules at a Glance Badges */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-4">
                <span className="text-xl shrink-0">🚭</span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">No Smoking</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Strictly non-smoking home & shared building areas.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-950/20 p-4">
                <span className="text-xl shrink-0">🐾</span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">No Pets</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Pets are not permitted on premises.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 p-4">
                <span className="text-xl shrink-0">🎉</span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">No Parties or Events</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Quiet residential community (Quiet hours: 10 PM – 8 AM).</p>
                </div>
              </div>
            </div>

            {/* Preset & Custom Rules List */}
            {property.rules && property.rules.length > 0 && (
              <div className="mt-4 rounded-2xl border border-border/80 bg-card p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">Additional Guest Guidelines</h4>
                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  {property.rules
                    .filter((r) => r.key === "preset" || r.key === "custom")
                    .map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="font-medium text-foreground">{rule.text}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
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
                      <span className="text-sm font-normal text-muted-foreground"> / night <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">+ GST</span></span>
                    </>
                  ) : (
                    <span className="text-lg font-medium text-muted-foreground">Rate on request</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 text-xs font-bold text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Verified
              </div>
            </div>

            <div className="mt-5 space-y-3.5">
              {/* Inquiry Action */}
              <Button
                asChild
                size="lg"
                className="w-full rounded-2xl bg-emerald-900 hover:bg-emerald-950 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold h-12 shadow-md"
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
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/60 text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-300 transition-colors hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60"
              >
                <MessageCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                Chat with Concierge on WhatsApp
              </a>

              <a
                href="tel:+917483270264"
                className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground pt-1"
              >
                <Phone className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                Call directly: (+91) 748-327-0264
              </a>
            </div>

            <div className="mt-6 border-t border-border/80 pt-4 space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                Direct coordination with on-ground property manager
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                100% Verified stay with professional housekeeping
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* 8. Airbnb-Style Room-by-Room Spaces Tour */}
      <PropertySpacesTour
        photos={property.photos}
        propertyName={property.name}
        amenities={property.amenities}
        roomSpecs={property.roomSpecs}
      />

      {/* 9. Cinematic Property Video Tour (if uploaded) */}
      {property.videos && property.videos.length > 0 && (
        <PropertyVideoTour videos={property.videos} propertyName={property.name} />
      )}

      {/* 10. Similar Curated Stays */}
      {similarStays.length > 0 && (
        <section className="border-t border-border/80 bg-slate-50/60 dark:bg-slate-950/40 py-16">
          <div className="site-container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
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

      {/* 11. Mobile Sticky Booking Bar */}
      <MobileBookingBar
        pricePerNight={property.nightlyPrice}
        currency={property.currency}
        propertyName={property.name}
      />
    </div>
  );
}
