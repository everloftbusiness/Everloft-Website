import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  markClassName,
  wordmarkClassName,
  variant = "dark",
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  variant?: "dark" | "light";
  showWordmark?: boolean;
}) {
  const isLight = variant === "light";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <div className={cn("relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg", markClassName)}>
        <Image
          src="/images/everloft-logo-mark.png"
          alt="Everloft"
          width={32}
          height={32}
          className="object-contain"
          priority
        />
      </div>
      {showWordmark && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-serif text-xl font-bold tracking-tight leading-none",
              isLight ? "text-white" : "text-primary",
              wordmarkClassName
            )}
          >
            EVERLOFT
          </span>
          <span
            className={cn(
              "text-[9px] font-medium tracking-wider uppercase",
              isLight ? "text-white/60" : "text-muted-foreground"
            )}
          >
            Handled with Purpose
          </span>
        </div>
      )}
    </span>
  );
}
