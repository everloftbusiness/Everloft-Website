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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSearchBar } from "@/components/site/hero-search-bar";
import { HeroBackdrop } from "@/components/site/hero-backdrop";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FeatureCard } from "@/components/marketing/feature-card";
import { ReviewCard } from "@/components/marketing/review-card";
import { StatCard } from "@/components/marketing/stat-card";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { getCities, getTopReviews, getProperties } from "@/lib/properties";
import { PublicPropertyCard, listPublicActiveProperties } from "@/features/properties";
import { homepageFaqs } from "@/lib/data/faqs";

// Modular marketing sections
import { DirectBookingComparison } from "@/components/marketing/direct-booking-comparison";
import { ReasonsToLove } from "@/components/marketing/reasons-to-love";
import { PopularLocations, type LocationSummary } from "@/components/marketing/popular-locations";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { MapBanner } from "@/components/marketing/map-banner";

const TRUST_PILLS = [
  { icon: Star, label: "4.9/5 Rating (500+ Reviews)" },
  { icon: ShieldCheck, label: "In-House Management" },
  { icon: Tag, label: "Transparent Pricing" },
  { icon: Zap, label: "Instant Confirmation" },
  { icon: Sparkles, label: "Hotel-Grade Cleanliness" },
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
  const [supabaseProperties, prismaProperties, cities, reviews] = await Promise.all([
    listPublicActiveProperties(8).catch(() => []),
    getProperties().catch(() => []),
    getCities().catch(() => []),
    getTopReviews(6).catch(() => []),
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
      {/* 1. Hero Section with Luxury Living Backdrop */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden pt-28 pb-16">
        <HeroBackdrop />
        <div className="site-container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-black/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Handled with Purpose • Premium Managed Stays
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="font-serif text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Stay Beyond Expectations
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                Discover premium villas, apartments, and curated boutique stays professionally managed by Everloft.
              </p>
            </Reveal>
          </div>

          {/* Trust badges strip */}
          <Reveal delay={0.15} className="mx-auto mt-8 flex max-w-4xl flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-white/90">
            {TRUST_PILLS.map((pill) => {
              const Icon = pill.icon;
              return (
                <div key={pill.label} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-md border border-white/10">
                  <Icon className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>{pill.label}</span>
                </div>
              );
            })}
          </Reveal>

          {/* Search Bar Widget */}
          <Reveal delay={0.2} className="mx-auto mt-10 max-w-4xl">
            <HeroSearchBar cities={cities} />
          </Reveal>
        </div>
      </section>

      {/* 2. Explore Our Homes (Featured Property Listings) */}
      <section className="section-padding bg-background">
        <div className="site-container">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                Featured Stays
              </span>
              <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                A Curated Few, Handled with Purpose
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-lg">
                Every property on Everloft is directly managed and inspected against rigorous hospitality standards.
              </p>
            </div>
            <Reveal>
              <Button asChild variant="outline" size="lg" className="rounded-full shrink-0 border-border hover:border-emerald-800 hover:text-emerald-800">
                <Link href="/properties">
                  View all properties <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Reveal>
          </div>

          {activeProperties.length > 0 ? (
            <RevealGroup className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {activeProperties.slice(0, 8).map((property) => (
                <RevealItem key={property.id}>
                  <PublicPropertyCard property={property} />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-foreground">New stays are being prepared</p>
              <p className="mt-2 text-sm text-muted-foreground">Our next collection of professionally managed homes will be available soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Our Collection by Property Type (Preserved from Original Site) */}
      <section className="section-padding bg-slate-50/70 border-t border-border/60">
        <div className="site-container">
          <SectionHeading
            eyebrow="Our Collection"
            title="Every kind of stay, one consistent standard"
            description="Explore our diverse range of curated residences designed for leisure, business, and family holidays."
          />
          <RevealGroup className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {COLLECTION.map((item) => {
              const Icon = item.icon;
              return (
                <RevealItem key={item.type}>
                  <Link
                    href={`/properties?type=${encodeURIComponent(item.type)}`}
                    className="group flex flex-col items-center gap-3 rounded-2xl border border-border/80 bg-card p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-emerald-700/40 hover:shadow-md"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-900 transition-colors group-hover:bg-emerald-900 group-hover:text-white">
                      <Icon className="h-5.5 w-5.5" strokeWidth={1.75} />
                    </span>
                    <span className="text-sm font-bold text-foreground">{item.type}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </Link>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* 4. The Direct Everloft Advantage (Direct Hospitality Overview) */}
      <section className="section-padding-tight bg-background border-t border-border/60">
        <div className="site-container">
          <Reveal>
            <DirectBookingComparison />
          </Reveal>
        </div>
      </section>

      {/* 5. What Our Guests Say (Real Verified Reviews) */}
      {reviews.length > 0 && (
        <section className="section-padding bg-slate-50/70 border-t border-border/60">
          <div className="site-container">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  Guest Experiences
                </div>
                <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  What Our Guests Say
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Authentic reviews from verified stays across the Everloft collection.
                </p>
              </div>
              <Button asChild variant="outline" size="lg" className="rounded-full shrink-0">
                <Link href="/properties">
                  View all reviews <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <RevealGroup className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <RevealItem key={review.id}>
                  <ReviewCard
                    guestName={review.guestName}
                    rating={review.rating}
                    title={review.title}
                    comment={review.comment}
                    stayMonth={review.stayMonth}
                    propertyName={review.property.name}
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {/* 6. More Reasons to Love Everloft (Amenities & Standards) */}
      <section className="section-padding bg-background border-t border-border/60">
        <div className="site-container">
          <SectionHeading
            eyebrow="The Everloft Standard"
            title="More Reasons to Love Everloft"
            description="Experience hotel-grade service, wrapped in the comfort and privacy of a beautifully maintained home."
          />
          <Reveal className="mt-10">
            <ReasonsToLove />
          </Reveal>
        </div>
      </section>

      {/* 7. Popular Locations */}
      {locationSummaries.length > 0 && (
        <section className="section-padding bg-slate-50/70 border-t border-border/60">
          <div className="site-container">
            <SectionHeading
              eyebrow="Destinations"
              title="Popular Locations & Retreats"
              description="Stay close to the best city hubs, tech corridors, and scenic getaways."
            />
            <Reveal className="mt-10">
              <PopularLocations locations={locationSummaries} />
            </Reveal>
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
                <StatCard value={8} suffix="+" label="Curated properties" />
              </RevealItem>
              <RevealItem>
                <StatCard value={6} label="Indian destinations" />
              </RevealItem>
              <RevealItem>
                <StatCard value={98} suffix="%" label="Guest satisfaction" />
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

      {/* 14. Partner With Us (Owner & Investor CTAs) */}
      <section className="section-padding bg-slate-50/70 border-t border-border/60">
        <div className="site-container grid gap-6 lg:grid-cols-2">
          <Reveal direction="left" className="relative overflow-hidden rounded-3xl bg-emerald-950 p-8 text-white sm:p-12 shadow-lg">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300">
              For Property Owners
            </span>
            <h3 className="font-serif text-3xl font-bold text-white mt-4">
              Let Your Property Earn More
            </h3>
            <p className="mt-3 max-w-sm text-sm text-white/80 leading-relaxed">
              Professional photography, dynamic revenue management, and hotel-grade operations — handled entirely by Everloft.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-7">
              <Link href="/property-management">
                Partner With Everloft <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Reveal>

          <Reveal direction="right" className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
              For Investors
            </span>
            <h3 className="font-serif text-3xl font-bold text-foreground mt-4">
              Grow With Everloft
            </h3>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground leading-relaxed">
              Structured hospitality investment opportunities with transparent returns across a high-performing property portfolio.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full bg-emerald-900 hover:bg-emerald-950 text-white font-medium px-7">
              <Link href="/investor-program">
                Explore Investor Program <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
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

      {/* 16. Newsletter Banner */}
      <section className="section-padding-tight bg-emerald-950 text-white border-t border-white/10">
        <div className="site-container">
          <div className="mx-auto max-w-xl text-center">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Everloft stories, in your inbox
            </h3>
            <p className="mt-2 text-sm text-white/70">
              New properties, seasonal features, and hospitality notes — zero spam.
            </p>
            <NewsletterForm className="mx-auto mt-6 max-w-md" />
          </div>
        </div>
      </section>
    </>
  );
}

