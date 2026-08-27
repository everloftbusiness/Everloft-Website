import Link from "next/link";
import Image from "next/image";
import {
  Star,
  ShieldCheck,
  Zap,
  Tag,
  ArrowRight,
  Sparkles,
  Award,
  Home,
  Building2,
  TreePalm,
  Building,
  Gem,
  Handshake,
  KeyRound,
  Scale,
  Link2,
  Settings,
  Layers,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSearchBar } from "@/components/site/hero-search-bar";
import { HeroBackdrop } from "@/components/site/hero-backdrop";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FeatureCard } from "@/components/marketing/feature-card";
import { StatCard } from "@/components/marketing/stat-card";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { getCities, getProperties } from "@/lib/properties";
import { PublicPropertyCard, listPublicActiveProperties } from "@/features/properties";
import { homepageFaqs } from "@/lib/data/faqs";

// Modular marketing sections
import { DirectBookingComparison } from "@/components/marketing/direct-booking-comparison";
import { ReasonsToLove } from "@/components/marketing/reasons-to-love";
import { PopularLocations, type LocationSummary } from "@/components/marketing/popular-locations";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { MapBanner } from "@/components/marketing/map-banner";

import {
  Calendar,
  CheckCircle,
  Headphones,
  Lock,
  Percent,
} from "lucide-react";

const HERO_TRUST_PILLS = [
  { icon: Tag, label: "Best Price Guarantee" },
  { icon: Percent, label: "No Platform Fees" },
  { icon: Zap, label: "Instant Confirmation" },
  { icon: Calendar, label: "Free Cancellation*" },
];

const HOSPITALITY_BADGES = [
  { icon: Tag, label: "Best Price Guaranteed" },
  { icon: Percent, label: "No Hidden Charges" },
  { icon: Sparkles, label: "Direct Booking Benefits" },
  { icon: Calendar, label: "Flexible Cancellation" },
  { icon: Headphones, label: "24/7 Guest Support" },
  { icon: Lock, label: "Secure Payments" },
];

const COLLECTION = [
  { type: "Villa", icon: Home, description: "Private pools & serene gardens" },
  { type: "Apartment", icon: Building2, description: "City-centre prime comfort" },
  { type: "Holiday Home", icon: TreePalm, description: "Family-sized getaways" },
  { type: "Boutique Stay", icon: Sparkles, description: "Intimate & characterful" },
  { type: "Penthouse", icon: Building, description: "Skyline & panoramic views" },
  { type: "Luxury Home", icon: Gem, description: "Signature statement stays" },
];

const WHAT_MAKES_EVERLOFT = [
  {
    icon: Handshake,
    title: "Dual Collaboration Model",
    description: "Full turnkey management or a collaborative commission model — property owners choose what fits best.",
  },
  {
    icon: KeyRound,
    title: "Investor-Friendly Approach",
    description: "Investors can participate in high-performing property assets with end-to-end operational execution.",
  },
  {
    icon: Scale,
    title: "Win-Win Value Structure",
    description: "Owners maximize real asset potential; guests experience consistent, professionally managed standards.",
  },
  {
    icon: Link2,
    title: "Dedicated Hospitality Operations",
    description: "In-house cleaning, guest concierge, and property maintenance managed with 5-star precision.",
  },
  {
    icon: Settings,
    title: "Direct Booking Ecosystem",
    description: "A transparent direct platform coupled with synchronized visibility across trusted global travel networks.",
  },
  {
    icon: Layers,
    title: "Standardized & System-Driven",
    description: "Proven hospitality operating procedures adapted smoothly across prime destinations and city centres.",
  },
];

export default async function HomePage() {
  const [supabaseProperties, prismaProperties, cities] = await Promise.all([
    listPublicActiveProperties(8).catch(() => []),
    getProperties().catch(() => []),
    getCities().catch(() => []),
  ]);

  // Combine listings: active supabase properties or prisma fallback
  const activeProperties = supabaseProperties.length > 0 ? supabaseProperties : prismaProperties.map((p) => {
    const imgUrl = (p.images?.[0]?.url && p.images[0].url.startsWith("http")) ? p.images[0].url : null;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      city: p.city,
      area: p.area,
      typeName: p.type,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      maxGuests: p.guests,
      currency: p.currency,
      nightlyPrice: p.pricePerNight,
      coverImageUrl: imgUrl,
      thumbnailUrl: imgUrl,
    };
  });

  // Derive dynamic location counts from actual properties
  const locationMap = new Map<string, number>();
  activeProperties.forEach((p) => {
    const loc = p.area || p.city || "Bangalore";
    locationMap.set(loc, (locationMap.get(loc) || 0) + 1);
  });
  cities.forEach((c) => {
    if (!locationMap.has(c)) {
      locationMap.set(c, 1);
    }
  });

  const locationSummaries: LocationSummary[] = Array.from(locationMap.entries())
    .slice(0, 5)
    .map(([city, count]) => ({
      city,
      count,
    }));

  return (
    <>
      {/* 1. Hero Section with Luxury Living Backdrop & Mobile Optimized Layout */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden pt-24 sm:pt-28 pb-12 sm:pb-16">
        <HeroBackdrop />
        <div className="site-container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.12] tracking-tight text-white">
                Premium Stays.<br />
                Professionally Managed.<br />
                <span className="text-emerald-400">Higher Returns.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.05}>
              <div className="mx-auto mt-4 max-w-xl space-y-0.5 text-xs sm:text-base font-medium text-white/85">
                <p>Luxury stays for guests.</p>
                <p>Complete management for owners.</p>
                <p>Smart opportunities for investors.</p>
              </div>
            </Reveal>
          </div>

          {/* Trust badges strip (2x2 on mobile, flex row on desktop) */}
          <Reveal delay={0.1} className="mx-auto mt-6 sm:mt-8 max-w-3xl">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-white/95">
              {HERO_TRUST_PILLS.map((pill) => {
                const Icon = pill.icon;
                return (
                  <div key={pill.label} className="flex items-center justify-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md border border-white/15 shadow-sm">
                    <Icon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{pill.label}</span>
                  </div>
                );
              })}
            </div>
          </Reveal>

          {/* Search Bar Widget */}
          <Reveal delay={0.15} className="mx-auto mt-6 sm:mt-10 max-w-4xl">
            <HeroSearchBar cities={cities} />
          </Reveal>
        </div>
      </section>

      {/* 2. Explore Our Homes (Featured Properties - Single Row Scroll with 9th View More Card) */}
      <section className="section-padding bg-background">
        <div className="site-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Explore Our Homes
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Curated stays professionally managed with 5-star standards.
              </p>
            </div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-400 hover:underline shrink-0"
            >
              View all properties <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {activeProperties.length > 0 ? (
            <div className="flex overflow-x-auto gap-4 sm:gap-6 snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-4">
              {activeProperties.slice(0, 8).map((property) => (
                <div key={property.id} className="snap-start shrink-0 w-[290px] sm:w-[320px]">
                  <PublicPropertyCard property={property} />
                </div>
              ))}
              {/* 9th "View More Properties" Card */}
              <Link
                href="/properties"
                className="snap-start shrink-0 w-[240px] sm:w-[260px] flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 text-center transition-all hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 group shadow-2xs"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-800 text-white shadow-sm transition-transform group-hover:scale-110">
                  <ArrowRight className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-foreground mt-4 group-hover:text-emerald-800">
                  View All Stays
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Explore complete portfolio ({activeProperties.length}) →</p>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
              <p className="text-base font-semibold text-foreground">New stays are being prepared</p>
              <p className="mt-1 text-xs text-muted-foreground">Our next collection of luxury homes will be available soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Trust & Hospitality Strip (Ribbon with 6 badges) */}
      <section className="border-y border-border/60 bg-slate-50/80 dark:bg-card py-4 sm:py-5 overflow-x-auto no-scrollbar">
        <div className="site-container flex items-center justify-between gap-6 min-w-max sm:min-w-0 sm:grid sm:grid-cols-3 lg:grid-cols-6">
          {HOSPITALITY_BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.label} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="whitespace-nowrap">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Why Book Direct With Everloft? Promo Card */}
      <section className="section-padding-tight bg-background">
        <div className="site-container">
          <div className="rounded-2xl sm:rounded-3xl border border-emerald-500/20 bg-[#F2F8F3] dark:bg-emerald-950/30 p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 shadow-sm border border-emerald-200/60">
                <Tag className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <h3 className="font-serif text-base sm:text-xl font-bold text-foreground">Why Book Direct With Everloft?</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Best price guaranteed when you book direct with us!</p>
              </div>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto rounded-xl sm:rounded-full bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs sm:text-sm px-6 h-11 shadow-sm shrink-0">
              <Link href="/properties">
                Book Direct & Save <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Everloft Signature Standards & Amenities */}
      <section className="section-padding bg-background border-t border-border/60">
        <div className="site-container">
          <div className="mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Everloft Signature Standards
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Every home is vetted, professionally cleaned, and managed with 5-star hospitality precision.
            </p>
          </div>
          <Reveal>
            <ReasonsToLove />
          </Reveal>
        </div>
      </section>

      {/* 7. Popular Locations */}
      {locationSummaries.length > 0 && (
        <section className="section-padding bg-slate-50/70 border-t border-border/60">
          <div className="site-container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Explore Popular Locations
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Stay close to the best city hubs, tech corridors, and scenic getaways.
                </p>
              </div>
              <Link
                href="/properties"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-400 hover:underline shrink-0"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <PopularLocations locations={locationSummaries} />
          </div>
        </section>
      )}

      {/* 8. What Makes Everloft (Collaborative Value Pillars) */}
      <section className="section-padding bg-slate-50/70 border-t border-border/60">
        <div className="site-container">
          <SectionHeading
            eyebrow="What Makes Everloft"
            title="Hospitality expertise, smart partnerships, transparent management"
            description="We blend operational hospitality expertise with transparent owner partnerships and modern management systems for sustained quality and long-term asset value."
          />
          <RevealGroup className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHAT_MAKES_EVERLOFT.map((item) => (
              <RevealItem key={item.title}>
                <FeatureCard {...item} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* 10. Experience Everloft & Key Brand Metrics */}
      <section className="section-padding bg-emerald-950 text-white border-t border-white/10">
        <div className="site-container grid items-center gap-14 lg:grid-cols-2">
          <Reveal direction="right">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl">
              <Image
                src="/images/pic01.webp"
                alt="A comfortable, professionally managed Everloft living space"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
                Experience Everloft
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight text-white mt-4">
                Every stay, considered down to the last detail
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-lg text-sm sm:text-base text-white/80 leading-relaxed">
                From the moment you arrive to the moment you leave, an Everloft stay is designed to feel effortless — hotel-grade housekeeping and support, wrapped in the privacy and character of a home.
              </p>
            </Reveal>
            <RevealGroup className="mt-8 grid grid-cols-3 gap-4 sm:gap-6">
              <RevealItem>
                <StatCard value={activeProperties.length || 16} suffix="+" label="Curated properties" />
              </RevealItem>
              <RevealItem>
                <StatCard value={1} label="Indian destinations" />
              </RevealItem>
              <RevealItem>
                <StatCard value={4.8} suffix="/5" label="Guest satisfaction" />
              </RevealItem>
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* 11. Explore on Map */}
      <section className="section-padding-tight bg-background">
        <div className="site-container">
          <Reveal>
            <MapBanner />
          </Reveal>
        </div>
      </section>

      {/* 12. 5-Step Guest Journey (How It Works) */}
      <section className="section-padding bg-slate-50/70 border-t border-border/60">
        <div className="site-container">
          <SectionHeading
            eyebrow="Simple & Seamless"
            title="How It Works"
            description="From discovering your stay to seamless check-in, we have refined every step of your experience."
          />
          <Reveal className="mt-10">
            <HowItWorks />
          </Reveal>
        </div>
      </section>

      {/* 13. Official Certifications & Compliance */}
      <section className="section-padding bg-background border-t border-border/60">
        <div className="site-container">
          <SectionHeading
            eyebrow="Credibility & Compliance"
            title="Verified Credentials & Certifications"
            description="Everloft operates with verified recognitions and official documentation upholding strict compliance."
          />
          <RevealGroup className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
            <RevealItem className="rounded-2xl border border-border/80 bg-card p-6 text-center shadow-sm">
              <div className="relative mx-auto mb-4 h-36 w-full overflow-hidden rounded-xl bg-slate-50">
                <Image
                  src="/certificates/dpiit-certificate-preview-rotated.webp"
                  alt="DPIIT certificate for Everloft"
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-contain p-3"
                />
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-700" />
                <h3 className="text-base font-bold text-foreground">Startup India</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">DPIIT Recognition Certified</p>
            </RevealItem>

            <RevealItem className="rounded-2xl border border-border/80 bg-card p-6 text-center shadow-sm">
              <div className="relative mx-auto mb-4 h-36 w-full overflow-hidden rounded-xl bg-slate-50">
                <Image
                  src="/certificates/company-document-preview.webp"
                  alt="Kerala Startup Mission certificate for Everloft"
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-contain p-3"
                />
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-700" />
                <h3 className="text-base font-bold text-foreground">Kerala Startup Mission</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Accredited Startup Certificate</p>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* 14. Own a Property? & Invest Beyond Real Estate (Dual Cards) */}
      <section className="section-padding bg-slate-50/70 border-t border-border/60">
        <div className="site-container">
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            {/* Own a Property */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-500/20 bg-emerald-950 text-white p-6 sm:p-8 shadow-md min-h-[200px]">
              <div className="relative z-10 max-w-[240px] sm:max-w-xs">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                  Own a Property?
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-white/80 leading-relaxed">
                  Maximize rental yield with turnkey management &amp; 5-star guest services.
                </p>
                <div className="mt-6">
                  <Button asChild variant="outline" size="sm" className="rounded-xl border-white/20 bg-white/10 hover:bg-white text-white hover:text-emerald-950 font-bold text-xs shadow-sm">
                    <Link href="/property-management">
                      Partner With Us <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 h-36 w-36 sm:h-44 sm:w-44 opacity-80 pointer-events-none">
                <Image
                  src="/images/pic01.webp"
                  alt="Own a property"
                  fill
                  sizes="200px"
                  className="object-cover rounded-tl-3xl"
                />
              </div>
            </div>

            {/* Invest Beyond Real Estate */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-slate-900 text-white p-6 sm:p-8 shadow-md min-h-[200px]">
              <div className="relative z-10 max-w-[240px] sm:max-w-xs">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-amber-300">
                  Invest Beyond Real Estate
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-white/80 leading-relaxed">
                  Earn predictable, high-yield passive returns with managed hospitality assets.
                </p>
                <div className="mt-6">
                  <Button asChild variant="outline" size="sm" className="rounded-xl border-amber-400/30 bg-amber-400/10 hover:bg-amber-400 text-amber-300 hover:text-slate-950 font-bold text-xs shadow-sm">
                    <Link href="/investor-program">
                      Explore Investment <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 h-36 w-36 sm:h-44 sm:w-44 opacity-80 pointer-events-none">
                <Image
                  src="/images/pic02.webp"
                  alt="Invest Beyond Real Estate"
                  fill
                  sizes="200px"
                  className="object-cover rounded-tl-3xl"
                />
              </div>
            </div>
          </div>

          {/* Have Questions? Bottom Green Banner */}
          <div className="mt-6 sm:mt-8 rounded-2xl sm:rounded-3xl bg-[#133E23] text-white p-5 sm:p-7 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white">Have Questions?</h3>
              <p className="text-xs sm:text-sm text-white/80 mt-0.5">We&apos;re here to help you find the perfect stay.</p>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto rounded-xl bg-white hover:bg-slate-100 text-emerald-950 font-bold text-xs sm:text-sm px-6 h-11 shadow-sm shrink-0">
              <Link href="/contact" className="flex items-center justify-center gap-2">
                <span>Contact Us</span>
                <Phone className="h-4 w-4 text-emerald-800" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 15. FAQ Accordion */}
      <section className="section-padding bg-background border-t border-border/60">
        <div className="site-container max-w-3xl">
          <SectionHeading
            eyebrow="Good to Know"
            title="Frequently Asked Questions"
            description="Clear answers about reservations, check-in procedures, amenities, and policies."
          />
          <Reveal className="mt-10">
            <FaqAccordion items={homepageFaqs} />
          </Reveal>
          <Reveal className="mt-8 text-center">
            <Button asChild variant="outline" size="lg" className="rounded-full border-border hover:border-emerald-800">
              <Link href="/faq">
                View all FAQs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </>
  );
}

