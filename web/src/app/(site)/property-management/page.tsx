import type { Metadata } from "next";
import {
  TrendingUp,
  MessageSquare,
  Sparkles,
  Link2,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
  FileCheck,
} from "lucide-react";
import { HeroBackdrop } from "@/components/site/hero-backdrop";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FeatureCard } from "@/components/marketing/feature-card";
import { RevenueCalculator } from "@/components/property-management/revenue-calculator";
import { OwnerLeadForm } from "@/components/property-management/owner-lead-form";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Owner Program",
  description:
    "Everloft is a full-stack hospitality management partner for villa owners and apartment investors — maximizing returns while protecting your asset.",
};

const CHALLENGES = [
  "Low occupancy rates and unpredictable demand.",
  "Poor guest screening and higher damage risk.",
  "Inconsistent housekeeping and maintenance quality.",
  "Pricing confusion across seasons and weekends.",
  "High platform commission reducing net returns.",
  "Time-consuming guest communication and coordination.",
];

const SOLUTIONS = [
  {
    icon: TrendingUp,
    title: "Revenue Optimization",
    description: "Dynamic pricing strategy, weekend premium optimization, and multi-platform listing strategy.",
  },
  {
    icon: MessageSquare,
    title: "Full Guest Management",
    description: "24/7 guest communication, screening and verification workflow, smooth check-in coordination.",
  },
  {
    icon: Sparkles,
    title: "Property Care",
    description: "Professional housekeeping standards, regular condition inspections, maintenance coordination.",
  },
  {
    icon: Link2,
    title: "Direct Booking Advantage",
    description: "Reduced third-party commission load, brand-level marketing support, repeat guest database.",
  },
];

const MODELS = [
  {
    label: "Model 1",
    title: "Full Management",
    description: "Ideal for owners who want passive income. Everloft handles listing, pricing, guests, housekeeping, maintenance, and reporting end-to-end.",
    note: "Best for: owners with limited time and remote investors.",
  },
  {
    label: "Model 2",
    title: "Commission-Based Partnership",
    description: "Ideal for owners who want to stay involved. Everloft runs bookings, demand optimization, and revenue systems while you keep operational visibility.",
    note: "Best for: active owners who want professional growth support.",
  },
];

const TRUST_METRICS = [
  { icon: ShieldCheck, title: "DPIIT Recognized", description: "Government-backed startup recognition under Startup India." },
  { icon: FileCheck, title: "Kerala Startup Mission Certified", description: "Accredited by Kerala Startup Mission for verified business operations." },
  { icon: BarChart3, title: "Average Occupancy Focus", description: "Targeting strong managed occupancy performance in the 70-85% range." },
  { icon: AlertTriangle, title: "Transparent Reporting", description: "Monthly performance reporting with clear revenue and cost visibility." },
];

const EARN_MORE = [
  "Smart pricing with demand-based rate control.",
  "Peak season planning with occupancy and ADR balance.",
  "Direct booking growth to reduce commission leakage.",
  "Monthly revenue and performance review reports.",
];

const STEPS = [
  { title: "Property Evaluation", description: "We assess location, condition, and market positioning." },
  { title: "Revenue Projection", description: "We share occupancy and earnings outlook based on demand data." },
  { title: "Agreement", description: "Model selection and onboarding documentation." },
  { title: "Listing & Optimization", description: "Professional setup, pricing, and distribution launch." },
  { title: "Go Live", description: "End-to-end guest and operations management starts." },
];

const OWNER_FAQS = [
  { question: "Do I lose ownership control?", answer: "No. You retain full ownership. Everloft manages operations based on the selected collaboration model." },
  { question: "How often do I get paid?", answer: "Payout cycles are defined in your agreement, with clear monthly reporting and transparent reconciliations." },
  { question: "What if the property is damaged?", answer: "Guest verification, security processes, and escalation workflows are used to reduce risk and address incidents quickly." },
  { question: "Can I block dates for personal use?", answer: "Yes. Owner-block dates can be pre-planned so personal use remains flexible and conflict-free." },
  { question: "What is the minimum contract period?", answer: "Contract terms vary by model and property profile. We share this clearly during onboarding." },
];

export default function PropertyManagementPage() {
  return (
    <>
      <section className="relative flex min-h-[62vh] items-center overflow-hidden pt-28 pb-16">
        <HeroBackdrop />
        <div className="site-container relative z-10 text-center">
          <Reveal>
            <p className="eyebrow mb-5 justify-center">Owner Growth Blueprint</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Everloft is not just a property listing service.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
              We are a full-stack hospitality management partner focused on maximizing returns
              while protecting your asset.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mx-auto mt-4 max-w-2xl text-white/60">
              Built for villa owners and apartment investors, Everloft solves low occupancy,
              guest handling stress, and operational inconsistency with one accountable team.
              The result is stronger ROI, cleaner operations, and stress-free ownership.
            </p>
          </Reveal>
          <Reveal delay={0.18} className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-2">
            {["Villa Owners", "Apartment Investors", "Higher ROI", "Hands-Free Management"].map((tag) => (
              <span key={tag} className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium text-white/80">
                {tag}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section-padding">
        <div className="site-container max-w-3xl">
          <SectionHeading eyebrow="The Challenge" title="The Challenges Property Owners Face" align="left" className="mx-0" />
          <Reveal className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CHALLENGES.map((c) => (
              <div key={c} className="flex items-start gap-2.5 rounded-xl border border-border p-4 text-sm text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {c}
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-soft">
        <div className="site-container">
          <SectionHeading eyebrow="The Solution" title="How Everloft Solves It" />
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SOLUTIONS.map((s) => (
              <RevealItem key={s.title}>
                <FeatureCard {...s} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="section-padding">
        <div className="site-container">
          <SectionHeading eyebrow="Partnership Models" title="Our Partnership Models" />
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
            {MODELS.map((m) => (
              <RevealItem key={m.title} className="rounded-2xl border border-border p-8">
                <p className="eyebrow mb-3">{m.label}</p>
                <h3 className="mb-3 text-xl font-bold text-primary">{m.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{m.description}</p>
                <p className="mt-4 text-xs font-medium text-gold">{m.note}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="section-padding bg-soft">
        <div className="site-container">
          <SectionHeading eyebrow="Trust & Credibility" title="Recognized, certified, transparent" />
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_METRICS.map((m) => (
              <RevealItem key={m.title}>
                <FeatureCard {...m} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="section-padding">
        <div className="site-container grid gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="Earn More" title="How You Earn More With Everloft" align="left" className="mx-0" />
            <ul className="mt-8 space-y-4">
              {EARN_MORE.map((e) => (
                <li key={e} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {e}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal direction="left">
            <SectionHeading eyebrow="Revenue Calculator" title="Estimate your earning potential" align="left" className="mx-0" />
            <div className="mt-8">
              <RevenueCalculator />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-soft">
        <div className="site-container max-w-3xl">
          <SectionHeading eyebrow="Getting Started" title="How to Get Started" />
          <div className="mt-14 space-y-10">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div className="mt-2 w-px flex-1 bg-border" />}
                </div>
                <div className="pb-2">
                  <h3 className="text-lg font-bold text-primary">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="site-container max-w-3xl">
          <SectionHeading eyebrow="FAQ" title="Frequently Asked Questions" />
          <Reveal className="mt-12">
            <FaqAccordion items={OWNER_FAQS} />
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-soft">
        <div className="site-container grid gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeading
              eyebrow="Get Started"
              title="Ready to turn your property into a high-performing asset?"
              description="Let Everloft build a growth-focused hospitality system around your property."
              align="left"
              className="mx-0"
            />
          </Reveal>
          <Reveal direction="left">
            <OwnerLeadForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
