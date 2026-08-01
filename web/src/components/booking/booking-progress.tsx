import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Guest Details", "Payment", "Confirmation"];

export function BookingProgress({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                  done && "border-gold bg-gold text-gold-foreground",
                  active && "border-primary bg-primary text-white",
                  !done && !active && "border-border bg-background text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  active || done ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {stepNum < STEPS.length && (
              <div
                className={cn(
                  "mx-3 h-0.5 flex-1 rounded-full transition-colors",
                  stepNum < current ? "bg-gold" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
