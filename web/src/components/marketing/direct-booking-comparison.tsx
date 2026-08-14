import Link from "next/link";
import { Check, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const DIRECT_ADVANTAGES = [
  "Direct communication with our on-ground hospitality managers",
  "Transparent pricing with no intermediary commissions or platform surcharges",
  "Personalized check-in coordination and dedicated concierge assistance",
  "Clear house rules, verified property photos, and reliable amenities",
  "Flexible stay extension requests and direct support response times",
];

export function DirectBookingComparison() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-white to-slate-50/50 p-6 sm:p-10 shadow-sm">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {/* Left column */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-900">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
            Direct Hospitality Standard
          </span>

          <h3 className="mt-4 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            The Everloft Direct Experience
          </h3>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed sm:text-base">
            When you coordinate directly through Everloft, you connect directly with the operational team managing the home — ensuring complete clarity, dedicated care, and transparent terms.
          </p>

          <ul className="mt-6 space-y-3">
            {DIRECT_ADVANTAGES.map((advantage) => (
              <li key={advantage} className="flex items-start gap-3 text-sm text-foreground/90 font-medium">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </div>
                <span>{advantage}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-emerald-900 hover:bg-emerald-950 text-white font-medium px-7 shadow-md"
            >
              <Link href="/properties">
                Explore Available Stays <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              End-to-end professional management for every curated stay.
            </p>
          </div>
        </div>

        {/* Right column: Transparency Table */}
        <div className="relative rounded-2xl border border-border bg-white p-6 shadow-md">
          <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold uppercase tracking-wider pb-3 border-b border-border">
            <span className="text-muted-foreground py-2 bg-muted/40 rounded-lg">Third-Party Portals</span>
            <span className="text-white py-2 bg-emerald-900 rounded-lg">Everloft Direct</span>
          </div>

          <div className="divide-y divide-border/60 text-sm">
            <div className="grid grid-cols-2 py-3.5 text-center">
              <span className="text-muted-foreground">Intermediary Support</span>
              <span className="font-semibold text-emerald-800">Direct In-House Team</span>
            </div>

            <div className="grid grid-cols-2 py-3.5 text-center">
              <span className="text-muted-foreground">Platform Surcharges</span>
              <span className="font-semibold text-emerald-800">Zero Intermediary Fees</span>
            </div>

            <div className="grid grid-cols-2 py-3.5 text-center">
              <span className="text-muted-foreground">Third-Party Listings</span>
              <span className="font-semibold text-emerald-800">100% Verified & Managed</span>
            </div>

            <div className="grid grid-cols-2 py-4 text-center bg-emerald-50/50 rounded-xl mt-2 font-bold">
              <span className="text-muted-foreground text-xs sm:text-sm">Crowdsourced Hosts</span>
              <span className="text-emerald-950 text-sm sm:text-base">Hospitality-Trained Staff</span>
            </div>
          </div>

          {/* Value Highlight Pill */}
          <div className="mt-5 flex items-center justify-between rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-800 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-950 uppercase tracking-wide">Direct Relationship</p>
                <p className="text-xs sm:text-sm font-bold text-emerald-900">Seamless coordination & transparent stay conditions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
