import type { Metadata } from "next";
import { MapPin, LineChart, Building2, Sparkles } from "lucide-react";
import { HeroBackdrop } from "@/components/site/hero-backdrop";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FeatureCard } from "@/components/marketing/feature-card";
import { PortfolioGrowthChart } from "@/components/investor/portfolio-growth-chart";
import { PortfolioMixChart } from "@/components/investor/portfolio-mix-chart";
import { InvestorLeadForm } from "@/components/investor/investor-lead-form";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { faqCategories } from "@/lib/data/faqs";

export const metadata: Metadata = {
  title: "Investor Program",
  description:
    "Invest in premium hospitality assets with Everloft through structured investment models, transparent reporting, and professional operations.",
};

const INVESTMENT_MODELS = [
  {
    label: "Model 1",
    title: "Development & Primary Share Model",
    tag: "Company-owned asset with investor participation.",
    points: [
      "Everloft identifies high-potential locations and acquires land or property.",
      "Development is executed from the ground up for hospitality optimization.",
      "Investors participate as primary shareholders in the asset.",
      "Everloft handles design, interior planning, brand positioning, and complete operations.",
    ],
    note: "Ideal for long-term vision investors and strategic partners who value asset appreciation with operational income.",
  },
  {
    label: "Model 2",
    title: "Long-Term Lease & Value Creation Model",
    tag: "Leased asset optimization strategy.",
    points: [
      "Everloft secures land or buildings through long-term lease agreements.",
      "The asset is transformed with design, furnishing, and hospitality optimization.",
      "Revenue is generated through structured pricing, occupancy management, and professional guest operations.",
      "The company retains a smaller structured income portion for sustainable scaling.",
    ],
    note: "Ideal for investors seeking structured hospitality exposure without full acquisition risk.",
  },
  {
    label: "Model 3",
    title: "Asset Management Partnership Model",
    tag: "Short-term high-potential area strategy.",
    points: [
      "Everloft partners with existing property owners in premium demand micro-markets.",
      "Properties are operated exclusively for short-term rental optimization.",
      "Everloft manages listings, revenue, guest screening, housekeeping, maintenance, and direct booking growth.",
      "The model prioritizes occupancy performance, pricing precision, and operational excellence.",
    ],
    note: "Ideal for investors seeking flexible asset exposure and strategic market entry without the development phase.",
  },
];

const VALUE_CREATION = [
  "Location-first acquisition strategy.",
  "Data-driven pricing optimization.",
  "Weekend and peak season premium structuring.",
  "Direct booking growth strategy.",
  "Professional housekeeping systems.",
  "Structured reporting and transparency.",
  "Brand-driven asset positioning.",
];

const WHY_INVEST = [
  { icon: MapPin, title: "Real Estate Insight", description: "Strategic location and asset selection with long-term value focus." },
  { icon: Building2, title: "Hospitality Operations", description: "End-to-end operations managed through professional service systems." },
  { icon: LineChart, title: "Revenue Optimization", description: "Demand-driven pricing and occupancy optimization for consistent performance." },
  { icon: Sparkles, title: "High-Performing Managed Assets", description: "Our approach prioritizes stability, transparency, and sustainable expansion." },
];

const investorFaqs = faqCategories.find((c) => c.slug === "investors")?.items ?? [];

export default function InvestorProgramPage() {
  return (
    <>
      <section className="relative flex min-h-[62vh] items-center overflow-hidden pt-28 pb-16">
        <HeroBackdrop />
        <div className="site-container relative z-10 text-center">
          <Reveal>
            <p className="eyebrow mb-5 justify-center">Investor Growth Blueprint</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Invest in Premium Hospitality Assets with Everloft
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-white/80">
              Everloft is building a portfolio of high-performing, short-term rental assets in
              carefully selected high-demand locations.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mx-auto mt-4 max-w-2xl text-white/60">
              We focus on strategic property acquisition, professional hospitality management,
              and long-term asset value creation — with transparency, operational control, and
              scalable growth for structured participation.
            </p>
          </Reveal>
          <Reveal delay={0.18} className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-2">
            {["Structured Participation", "Transparent Reporting", "Scalable Growth", "Managed Hospitality Assets"].map((tag) => (
              <span key={tag} className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium text-white/80">
                {tag}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section-padding">
        <div className="site-container">
          <SectionHeading
            eyebrow="Investment Models"
            title="Our Investment Models"
            description="We offer multiple structured models depending on the asset type, location, and growth strategy."
          />
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {INVESTMENT_MODELS.map((m) => (
              <RevealItem key={m.title} className="flex flex-col rounded-2xl border border-border p-8">
                <p className="eyebrow mb-3">{m.label}</p>
                <h3 className="mb-1.5 text-lg font-bold text-primary">{m.title}</h3>
                <p className="mb-4 text-sm font-medium text-gold">{m.tag}</p>
                <ul className="flex-1 space-y-2.5 text-sm text-muted-foreground">
                  {m.points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" /> {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">{m.note}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="section-padding bg-soft">
        <div className="site-container grid gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="Value Creation" title="How Everloft Creates Value" align="left" className="mx-0" />
            <ul className="mt-8 space-y-3">
              {VALUE_CREATION.map((v) => (
                <li key={v} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" /> {v}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              We focus not only on revenue generation, but also on asset preservation, market
              positioning, long-term brand equity, and scalable operational systems.
            </p>
          </Reveal>
          <Reveal direction="left" className="space-y-6">
            <PortfolioGrowthChart />
            <PortfolioMixChart />
            <p className="text-center text-xs text-muted-foreground">
              Figures shown are illustrative of portfolio trajectory, not guaranteed returns.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding">
        <div className="site-container">
          <SectionHeading eyebrow="Why Everloft" title="Why Invest with Everloft" description="Everloft operates with a structured hospitality framework supported by recognized startup credentials and a growth-focused expansion model." />
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_INVEST.map((item) => (
              <RevealItem key={item.title}>
                <FeatureCard {...item} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="section-padding bg-primary text-white">
        <div className="site-container max-w-2xl text-center">
          <Reveal>
            <p className="eyebrow mb-4 justify-center">Our Vision</p>
            <h2 className="heading-display text-2xl text-white sm:text-3xl">
              To build a portfolio of strategically located, professionally managed hospitality
              assets that deliver consistent performance and long-term value creation.
            </h2>
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-soft">
        <div className="site-container max-w-3xl">
          <SectionHeading eyebrow="FAQ" title="Common investor questions" />
          <Reveal className="mt-12">
            <FaqAccordion items={investorFaqs} />
          </Reveal>
        </div>
      </section>

      <section className="section-padding">
        <div className="site-container grid gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeading
              eyebrow="Get Started"
              title="Request the investor deck"
              description="Share a few details and our investment team will send our full deck and schedule an introductory call."
              align="left"
              className="mx-0"
            />
          </Reveal>
          <Reveal direction="left">
            <InvestorLeadForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
