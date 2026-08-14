import { Camera, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PropertyMedia({
  seed,
  type = "Curated Stay",
  label,
  className,
}: {
  seed?: string;
  type?: string;
  label?: string;
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 p-6 text-center select-none border border-slate-200/80 dark:border-slate-700/60 overflow-hidden",
        className
      )}
      role="img"
      aria-label={label || `${type} — Photos coming soon`}
    >
      {/* Subtle background decorative pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />

      {/* Center Icon & Badge */}
      <div className="relative z-10 flex flex-col items-center gap-2.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-700/80 text-slate-400 dark:text-slate-300 shadow-sm border border-slate-200/60 dark:border-slate-600/50">
          <Camera className="h-6 w-6 stroke-[1.75]" />
        </div>

        <div className="flex flex-col items-center">
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Photos Coming Soon
          </span>
          <span className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-400 max-w-[180px] leading-tight">
            Official photography for this stay is being prepared
          </span>
        </div>
      </div>
    </div>
  );
}
