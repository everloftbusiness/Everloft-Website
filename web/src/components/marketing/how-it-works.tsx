import { Search, ShieldCheck, KeyRound, HeartHandshake, Star, ArrowRight } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: Search,
    title: "Search Stays",
    description: "Browse verified premium homes across prime destinations.",
  },
  {
    step: "02",
    icon: ShieldCheck,
    title: "Direct Reservation",
    description: "Reserve with transparent terms and direct in-house coordination.",
  },
  {
    step: "03",
    icon: KeyRound,
    title: "Self Check-in",
    description: "Enjoy seamless keyless arrival and instant room readiness.",
  },
  {
    step: "04",
    icon: HeartHandshake,
    title: "Feel at Home",
    description: "Experience hotel-grade cleanliness & 24/7 dedicated support.",
  },
  {
    step: "05",
    icon: Star,
    title: "Share Review",
    description: "Share your experience and unlock repeat guest loyalty perks.",
  },
];

export function HowItWorks() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 relative">
      {STEPS.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={item.step}
            className="group relative flex flex-col items-center rounded-2xl border border-border/80 bg-card p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-700/40 hover:shadow-md"
          >
            <span className="text-[11px] font-bold tracking-widest text-emerald-800 uppercase mb-3">
              Step {item.step}
            </span>

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-900 transition-colors group-hover:bg-emerald-900 group-hover:text-white shadow-inner">
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </div>

            <h4 className="text-base font-bold text-foreground">{item.title}</h4>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
}
