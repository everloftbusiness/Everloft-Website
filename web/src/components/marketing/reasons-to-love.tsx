import { KeyRound, Wifi, UtensilsCrossed, Sparkles, ShieldCheck, Car } from "lucide-react";

const REASONS = [
  {
    icon: KeyRound,
    title: "Smart Check-in",
    description: "Keyless digital entry or personal greeting for seamless arrival.",
  },
  {
    icon: Wifi,
    title: "High-Speed WiFi",
    description: "Dedicated high-bandwidth internet tailored for work and leisure.",
  },
  {
    icon: UtensilsCrossed,
    title: "Fully Equipped Kitchens",
    description: "Complete cookware, appliances, and dining essentials in every home.",
  },
  {
    icon: Sparkles,
    title: "Hotel-Grade Cleanliness",
    description: "Sanitized and prepared by professional in-house housekeeping teams.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Secure",
    description: "Verified gated societies, secure access, and round-the-clock team support.",
  },
  {
    icon: Car,
    title: "Dedicated Parking",
    description: "Convenient on-site or reserved parking space for peace of mind.",
  },
];

export function ReasonsToLove() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {REASONS.map((reason) => {
        const Icon = reason.icon;
        return (
          <div
            key={reason.title}
            className="group flex flex-col items-center rounded-2xl border border-border/80 bg-card p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-emerald-700/40 hover:shadow-md"
          >
            <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 transition-colors group-hover:bg-emerald-900 group-hover:text-white">
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <h4 className="text-sm font-bold text-foreground">{reason.title}</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{reason.description}</p>
          </div>
        );
      })}
    </div>
  );
}
