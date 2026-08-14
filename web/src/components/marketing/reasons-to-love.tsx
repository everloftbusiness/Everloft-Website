import { Maximize2, Wifi, UtensilsCrossed, Sparkles, ShieldCheck, KeyRound } from "lucide-react";

const LIFE_FEATURES = [
  {
    icon: Maximize2,
    title: "Spacious Living",
  },
  {
    icon: Wifi,
    title: "Fast Wi-Fi",
  },
  {
    icon: UtensilsCrossed,
    title: "Fully Equipped Kitchen",
  },
  {
    icon: Sparkles,
    title: "Housekeeping Support",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Secure",
  },
  {
    icon: KeyRound,
    title: "Self Check-in",
  },
];

export function ReasonsToLove() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-border/60 rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm">
      {LIFE_FEATURES.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="flex flex-col items-center justify-center p-4 sm:p-5 text-center transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
          >
            <div className="mb-2.5 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Icon className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-emerald-700 dark:text-emerald-400" strokeWidth={1.75} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">{item.title}</h4>
          </div>
        );
      })}
    </div>
  );
}
