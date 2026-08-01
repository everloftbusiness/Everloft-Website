import type { Metadata } from "next";
import { Compass, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { HeroBackdrop } from "@/components/site/hero-backdrop";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FeatureCard } from "@/components/marketing/feature-card";
import { StatCard } from "@/components/marketing/stat-card";
import { PropertyMedia } from "@/components/media/property-media";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "About Everloft",
  description:
    "Everloft is a premium hospitality brand professionally managing a curated collection of villas, apartments, and boutique stays across India.",
};

const STANDARDS = [
  {
    icon: ShieldCheck,
    title: "Professional Hospitality",
    description: "Hotel-grade operations applied to every home — from housekeeping SOPs to guest communication scripts.",
  },
  {
    icon: Heart,
    title: "Guest-First Philosophy",
    description: "Every decision, from pricing to policy, is weighed against a single question: does this serve the guest?",
  },
  {
    icon: Sparkles,
    title: "Why Guests Love Everloft",
    description: "Consistency. Every Everloft stay meets the same bar, regardless of city, property type, or season.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative flex min-h-[60vh] items-center overflow-hidden pt-28 pb-16">
        <HeroBackdrop />
        <div className="site-container relative z-10 text-center">
          <Reveal>
            <p className="eyebrow mb-5 justify-center">About Everloft</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Hospitality, reimagined as a home
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-white/70">
              Everloft was founded on a simple belief: a beautiful stay shouldn&apos;t require
              gambling on a stranger&apos;s spare room. Every property we offer is professionally
              managed, end to end, by our own team.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding">
        <div className="site-container grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Our Story" title="Built by hospitality people, not marketplace people" align="left" className="mx-0" />
            <Reveal delay={0.05}>
              <p className="mt-6 leading-relaxed text-muted-foreground">
                Everloft began with a frustration familiar to frequent travellers: villa and
                apartment rentals looked stunning in photos and fell apart in person —
                inconsistent cleaning, unresponsive hosts, and no real accountability. We set
                out to build the opposite. A single operator, holding every property in our
                collection to one hospitality standard, so a booking with Everloft always
                means the same thing.
              </p>
            </Reveal>
            <div className="mt-8 grid grid-cols-2 gap-6">
              <Reveal>
                <h3 className="mb-1.5 text-sm font-bold uppercase tracking-wide text-gold">Mission</h3>
                <p className="text-sm text-muted-foreground">
                  Make exceptional, professionally managed stays the default, not the exception.
                </p>
              </Reveal>
              <Reveal delay={0.05}>
                <h3 className="mb-1.5 text-sm font-bold uppercase tracking-wide text-gold">Vision</h3>
                <p className="text-sm text-muted-foreground">
                  A curated Everloft address in every destination worth visiting.
                </p>
              </Reveal>
            </div>
          </div>
          <Reveal direction="right" className="aspect-[4/3] overflow-hidden rounded-2xl">
            <PropertyMedia seed="about-story" showIcon={false} className="h-full" />
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-soft">
        <div className="site-container">
          <SectionHeading eyebrow="Our Standards" title="What we hold every property to" />
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {STANDARDS.map((s) => (
              <RevealItem key={s.title}>
                <FeatureCard {...s} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="section-padding bg-primary text-white">
        <div className="site-container">
          <RevealGroup className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <RevealItem>
              <StatCard value={8} suffix="+" label="Managed properties" />
            </RevealItem>
            <RevealItem>
              <StatCard value={4200} suffix="+" label="Guests hosted" />
            </RevealItem>
            <RevealItem>
              <StatCard value={6} label="Destinations across India" />
            </RevealItem>
            <RevealItem>
              <StatCard value={92} suffix="%" label="Average occupancy" />
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      <section className="section-padding">
        <div className="site-container grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="order-2 aspect-[4/3] overflow-hidden rounded-2xl lg:order-1">
            <PropertyMedia seed="about-lifestyle" showIcon={false} className="h-full" />
          </Reveal>
          <div className="order-1 lg:order-2">
            <p className="eyebrow mb-5 flex items-center gap-2">
              <Compass className="h-4 w-4" /> Where we&apos;re headed
            </p>
            <h2 className="heading-display text-2xl sm:text-3xl">
              A growing collection, without compromise
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              We add properties deliberately — each one inspected, negotiated, and onboarded
              by our own operations team before it ever reaches this site. We&apos;d rather
              grow slowly and stay consistent than grow fast and dilute the standard.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
