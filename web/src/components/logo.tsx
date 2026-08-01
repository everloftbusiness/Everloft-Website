import { cn } from "@/lib/utils";

export function Logo({
  className,
  markClassName,
  wordmarkClassName,
  variant = "dark",
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  variant?: "dark" | "light";
}) {
  const textColor = variant === "light" ? "text-white" : "text-primary";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 32 32"
        className={cn("h-7 w-7 shrink-0", markClassName)}
        aria-hidden
      >
        <rect x="1" y="1" width="30" height="30" rx="8" className={variant === "light" ? "fill-white/10" : "fill-primary"} />
        <path
          d="M16 7L23.5 13.2V24H19.6V17.4H12.4V24H8.5V13.2L16 7Z"
          className="fill-gold"
        />
      </svg>
      <span className={cn("font-sans text-lg font-bold tracking-tight leading-none", textColor, wordmarkClassName)}>
        Everloft
      </span>
    </span>
  );
}
