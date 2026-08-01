import Link from "next/link";
import {
  ShieldCheck,
  BadgeCheck,
  Sparkles,
  Headset,
  DoorOpen,
  Lock,
  ArrowRight,
  Home,
  Building2,
  TreePalm,
  Building,
  Gem,
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
import Image from "next/image";
import { Handshake, KeyRound, Scale, Link2, Settings, Layers } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { getCities, getTopReviews } from "@/lib/properties";
import { PublicPropertyCard, listPublicActiveProperties } from "@/features/properties";
import { homepageFaqs } from "@/lib/data/faqs";

const WHY_EVERLOFT = [
  {
    icon: ShieldCheck,
    title: "Professional Management",
    description: "Every property is run end to end by Everloft's in-house hospitality team.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Properties",
    description: "Each home is inspected and re-verified quarterly against our own standard.",
  },
  {
    icon: Sparkles,
    title: "Hotel Standard Cleaning",
    description: "Housekeeping protocols modeled on 5-star hospitality, every single stay.",
  },
  {
    icon: Headset,
    title: "24×7 Support",
    description: "A real person is always a call or WhatsApp message away, day or night.",
  },
  {
    icon: DoorOpen,
    title: "Flexible Check-in",
    description: "Contactless smart-lock access or a personal welcome — your choice.",
  },
  {
    icon: Lock,
    title: "Secure Booking",
    description: "Encrypted payments and direct confirmations — never a third-party host.",
  },
];

const WHAT_MAKES_EVERLOFT = [
  {
    icon: Handshake,
    title: "Dual Collaboration Model",
    description: "Full management model, or a partnership / commission-based collaboration — owners choose what fits.",
  },
  {
    icon: KeyRound,
    title: "Investor-Friendly Approach",
    description: "Investors can own or fund properties while Everloft manages operations end-to-end.",
  },
  {
    icon: Scale,
    title: "Win-Win Structure",
    description: "Hosts earn higher net income; investors gain professionally managed, hospitality-backed returns.",
  },
  {
    icon: Link2,
    title: "Special Privileges for Collaborators",
    description: "Preferential stays and concessions across Everloft properties.",
  },
  {
    icon: Settings,
    title: "Direct Booking Ecosystem",
    description: "Listed on our own platform to reduce third-party commissions, while staying visible on Airbnb, Booking.com, and MakeMyTrip.",
  },
  {
    icon: Layers,
    title: "Scalable & System-Driven Operations",
    description: "Easily adaptable across cities and tourist destinations, balanced across direct and trusted third-party channels.",
  },
];

const COLLECTION = [
  { type: "Villa", icon: Home, description: "Private pools & gardens" },
  { type: "Apartment", icon: Building2, description: "City-centre comfort" },
  { type: "Holiday Home", icon: TreePalm, description: "Family-sized escapes" },
  { type: "Boutique Stay", icon: Sparkles, description: "Intimate & characterful" },
  { type: "Penthouse", icon: Building, description: "Skyline & sea views" },
  { type: "Luxury Home", icon: Gem, description: "Statement residences" },
];

export default async function HomePage() {
  const [featured, cities, reviews] = await Promise.all([
    listPublicActiveProperties(6),
    getCities(),
    getTopReviews(6),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden pt-28 pb-16">
        <HeroBackdrop />
        <div className="site-container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="eyebrow mb-6 justify-center">Premium Managed Hospitality</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white text-balance-safe sm:text-5xl lg:text-6xl">
                Stay Beyond Expectations.
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                Discover premium villas, apartments, and curated stays professionally
                managed by Everloft.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.18} className="mx-auto mt-10 max-w-4xl">
            <HeroSearchBar cities={cities} />
          </Reveal>

          <Reveal delay={0.24} className="mx-auto mt-10 flex max-w-xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/60">
            <span>8+ curated properties</span>
            <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:block" />
            <span>Direct booking, zero commission games</span>
            <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:block" />
            <span>24×7 guest support</span>
          </Reveal>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="section-padding">
        <div className="site-container">
          <div className="flex flex-col items-end justify-between gap-6 sm:flex-row">
            <SectionHeading
              eyebrow="Featured Stays"
              title="A curated few, chosen with care"
              description="Every home on Everloft is directly managed by us — no crowd-sourced listings, no surprises."
              align="left"
              className="mx-0"
            />
            <Reveal>
              <Button asChild variant="outline" size="lg" className="rounded-full shrink-0">
                <Link href="/properties">
                  View all properties <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </Reveal>
          </div>

          {featured.length > 0 ? (
            <RevealGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((property) => (
                <RevealItem key={property.id}>
                  <PublicPropertyCard property={property} />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <div className="mt-12 rounded-2xl border border-dashed border-border bg-soft px-6 py-12 text-center">
              <p className="text-lg font-semibold text-primary">New stays are being prepared</p>
              <p className="mt-2 text-sm text-muted-foreground">Our next collection of professionally managed homes will be available soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Everloft */}
      <section className="section-padding bg-soft">
        <div className="site-container">
          <SectionHeading
            eyebrow="Why Everloft"
            title="Hospitality, run the way it should be"
            description="Everything you'd expect from a 5-star brand, applied to homes you'd actually want to live in."
          />
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_EVERLOFT.map((item) => (
              <RevealItem key={item.title}>
                <FeatureCard {...item} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Our Collection */}
      <section className="section-padding">
        <div className="site-container">
          <SectionHeading
            eyebrow="Our Collection"
            title="Every kind of stay, one consistent standard"
          />
          <RevealGroup className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {COLLECTION.map((item) => (
              <RevealItem key={item.type}>
                <Link
                  href={`/properties?type=${encodeURIComponent(item.type)}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border p-6 text-center transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_20px_50px_-25px_rgba(15,23,42,0.3)]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white transition-colors group-hover:bg-gold group-hover:text-gold-foreground">
                    <item.icon className="h-5.5 w-5.5" strokeWidth={1.5} />
                  </span>
                  <span className="text-sm font-bold text-primary">{item.type}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* What Makes Everloft */}
      <section className="section-padding bg-soft">
        <div className="site-container">
          <SectionHeading
            eyebrow="What Makes Everloft"
            title="Hospitality expertise, smart partnerships, direct bookings"
            description="We blend hospitality expertise, smart partnerships, and end-to-end management with transparent operations and optimized revenue systems — for sustainable growth, higher returns, and a consistently superior stay."
          />
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHAT_MAKES_EVERLOFT.map((item) => (
              <RevealItem key={item.title}>
                <FeatureCard {...item} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Certifications */}
      <section className="section-padding">
        <div className="site-container">
          <SectionHeading
            eyebrow="Certification & Accreditation"
            title="Verified credentials, operational credibility"
            description="Everloft maintains verified certifications and official documentation that support our operational credibility and compliance standards."
          />
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
            <RevealItem className="rounded-2xl border border-border p-6 text-center">
              <div className="relative mx-auto mb-5 h-40 w-full overflow-hidden rounded-xl bg-soft">
                <Image src="/certificates/dpiit-certificate-preview-rotated.png" alt="DPIIT certificate for Everloft" fill className="object-contain p-3" />
              </div>
              <h3 className="text-base font-bold text-primary">Startup India</h3>
              <p className="text-sm text-muted-foreground">DPIIT Recognition Certified</p>
            </RevealItem>
            <RevealItem className="rounded-2xl border border-border p-6 text-center">
              <div className="relative mx-auto mb-5 h-40 w-full overflow-hidden rounded-xl bg-soft">
                <Image src="/certificates/company-document-preview.png" alt="Kerala Startup Mission certificate for Everloft" fill className="object-contain p-3" />
              </div>
              <h3 className="text-base font-bold text-primary">Kerala Startup Mission</h3>
              <p className="text-sm text-muted-foreground">Accredited Startup Certificate</p>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* Experience Everloft */}
      <section className="section-padding bg-primary text-white">
        <div className="site-container grid items-center gap-14 lg:grid-cols-2">
          <Reveal direction="right">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image src="/images/pic01.jpg" alt="A comfortable, professionally managed Everloft living space" fill className="object-cover" />
            </div>
          </Reveal>
          <div>
            <Reveal>
              <p className="eyebrow mb-5">Experience Everloft</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="heading-display text-3xl leading-tight text-white md:text-4xl">
                Every stay, considered down to the last detail
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-lg text-white/70 leading-relaxed">
                From the moment you arrive to the moment you leave, an Everloft stay is
                designed to feel effortless — hotel-grade service, wrapped in the privacy
                and character of a home.
              </p>
            </Reveal>
            <RevealGroup className="mt-10 grid grid-cols-3 gap-6">
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

      {/* Guest Reviews */}
      {reviews.length > 0 && (
        <section className="section-padding">
          <div className="site-container">
            <SectionHeading
              eyebrow="Guest Reviews"
              title="What our guests are saying"
              description="Real words from stays across our collection."
            />
            <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Owner + Investor CTA */}
      <section className="section-padding bg-soft">
        <div className="site-container grid gap-6 lg:grid-cols-2">
          <Reveal direction="left" className="relative overflow-hidden rounded-2xl bg-primary p-10 text-white sm:p-12">
            <p className="eyebrow mb-4">For Property Owners</p>
            <h3 className="heading-display text-2xl text-white sm:text-3xl">
              Let Your Property Earn More
            </h3>
            <p className="mt-4 max-w-sm text-white/70">
              Professional photography, dynamic pricing, and hotel-grade operations —
              handled entirely by Everloft.
            </p>
            <Button asChild variant="gold" size="lg" className="mt-8 rounded-full">
              <Link href="/property-management">
                Partner With Everloft <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
          <Reveal direction="right" className="relative overflow-hidden rounded-2xl border border-border bg-card p-10 sm:p-12">
            <p className="eyebrow mb-4">For Investors</p>
            <h3 className="heading-display text-2xl sm:text-3xl">Grow With Everloft</h3>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Structured investment opportunities across a growing, professionally
              managed hospitality portfolio.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full">
              <Link href="/investor-program">
                Explore the Investor Program <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="section-padding">
        <div className="site-container max-w-3xl">
          <SectionHeading eyebrow="Good to Know" title="Frequently asked questions" />
          <Reveal className="mt-12">
            <FaqAccordion items={homepageFaqs} />
          </Reveal>
          <Reveal className="mt-8 text-center">
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href="/faq">
                View all FAQs <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-padding-tight bg-primary text-white">
        <div className="site-container">
          <div className="mx-auto max-w-xl text-center">
            <h3 className="heading-display text-2xl text-white sm:text-3xl">
              Everloft stories, in your inbox
            </h3>
            <p className="mt-3 text-white/70">
              New properties, seasonal offers, and hospitality notes — no spam, ever.
            </p>
            <NewsletterForm className="mx-auto mt-8 max-w-md" />
          </div>
        </div>
      </section>
    </>
  );
}
