import Link from "next/link";
import { Tag, ArrowRight, Sparkles, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const OFFERS = [
  {
    discount: "10% OFF",
    title: "Weekend Getaway",
    condition: "On stays of 2+ nights",
    code: "EVER10",
  },
  {
    discount: "15% OFF",
    title: "Weekly Stay",
    condition: "On stays of 7+ nights",
    code: "WEEK15",
  },
  {
    discount: "20% OFF",
    title: "Monthly Long Stay",
    condition: "On stays of 30+ nights",
    code: "MONTH20",
  },
];

export function SpecialOffers() {
  return (
    <div className="overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-emerald-50/50 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-3 py-1 text-xs font-bold text-amber-950 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-amber-800" />
            Extended Stay Privileges
          </span>
          <h3 className="mt-2 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Special Extended Stay Offers
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated rate privileges for weekend escapes, weekly getaways, and long-term relocations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 flex-1 lg:max-w-2xl">
          {OFFERS.map((offer) => (
            <div
              key={offer.code}
              className="flex flex-col justify-between rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur"
            >
              <div>
                <span className="text-xl font-extrabold text-emerald-800">{offer.discount}</span>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{offer.condition}</p>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/60 px-3 py-1.5 text-xs">
                <span className="text-[11px] text-muted-foreground font-medium">Code:</span>
                <span className="font-mono font-bold text-foreground tracking-wider">{offer.code}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex shrink-0">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto rounded-full bg-emerald-900 hover:bg-emerald-950 text-white font-medium px-6 shadow-sm"
          >
            <Link href="/properties">
              View All Stays <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
