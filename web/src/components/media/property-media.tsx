import { Building2, Gem, Home, Sparkles, TreePalm, Building } from "lucide-react";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #33261200 100%), radial-gradient(circle at 85% 15%, rgba(212,175,55,0.35), transparent 55%)",
  "linear-gradient(150deg, #10192f 0%, #1d2b4a 60%, #0f172a 100%), radial-gradient(circle at 10% 90%, rgba(37,99,235,0.35), transparent 55%)",
  "linear-gradient(140deg, #142032 0%, #0f172a 55%, #1a1206 100%), radial-gradient(circle at 90% 85%, rgba(212,175,55,0.25), transparent 60%)",
  "linear-gradient(160deg, #0b1220 0%, #16233d 50%, #0f172a 100%), radial-gradient(circle at 20% 20%, rgba(148,163,184,0.25), transparent 55%)",
  "linear-gradient(145deg, #1a2440 0%, #0f172a 60%, #241a08 100%), radial-gradient(circle at 75% 25%, rgba(212,175,55,0.3), transparent 55%)",
  "linear-gradient(155deg, #0f172a 0%, #1e293b 40%, #102a43 100%), radial-gradient(circle at 15% 80%, rgba(37,99,235,0.3), transparent 55%)",
];

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Villa: Home,
  Apartment: Building2,
  "Holiday Home": TreePalm,
  "Boutique Stay": Sparkles,
  Penthouse: Building,
  "Luxury Home": Gem,
};

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function PropertyMedia({
  seed,
  type,
  label,
  className,
  showIcon = true,
}: {
  seed: string;
  type?: string;
  label?: string;
  className?: string;
  showIcon?: boolean;
}) {
  const gradient = GRADIENTS[hashSeed(seed) % GRADIENTS.length];
  const Icon = (type && TYPE_ICON[type]) || Home;

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        className
      )}
      style={{ backgroundImage: gradient }}
      aria-hidden={!label}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <svg className="absolute inset-0 h-full w-full opacity-[0.05] mix-blend-overlay" aria-hidden>
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-transparent" />
      {showIcon && (
        <Icon className="relative h-9 w-9 text-white/25" strokeWidth={1.25} />
      )}
    </div>
  );
}
