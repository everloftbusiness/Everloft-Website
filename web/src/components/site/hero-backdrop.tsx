import { cn } from "@/lib/utils";

export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-primary", className)}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% 10%, rgba(212,175,55,0.28), transparent 55%), radial-gradient(circle at 8% 85%, rgba(37,99,235,0.28), transparent 55%), linear-gradient(160deg, #0b1220 0%, #101c34 45%, #0f172a 100%)",
        }}
      />
      <svg
        className="absolute inset-x-0 bottom-0 h-1/2 w-full opacity-[0.16]"
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 320 L160 220 L280 300 L420 140 L560 260 L720 100 L900 260 L1040 160 L1200 280 L1440 180 L1440 400 L0 400 Z"
          fill="#D4AF37"
        />
      </svg>
      <svg className="absolute inset-0 h-full w-full opacity-[0.04] mix-blend-overlay" aria-hidden>
        <filter id="hero-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-grain)" />
      </svg>
      <div className="absolute inset-0 bg-linear-to-t from-primary via-transparent to-primary/40" />
    </div>
  );
}
