import { Star, Quote, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewCard({
  guestName,
  rating,
  title,
  comment,
  stayMonth,
  propertyName,
  className,
}: {
  guestName: string;
  rating: number;
  title?: string | null;
  comment: string;
  stayMonth?: string | null;
  propertyName?: string;
  className?: string;
}) {
  const initials = guestName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn("h-4 w-4", i < rating ? "fill-amber-500 text-amber-500" : "text-border")}
            />
          ))}
        </div>
        <Quote className="h-5 w-5 text-emerald-800/30" />
      </div>

      {title && <h4 className="mb-1.5 text-base font-bold text-foreground">{title}</h4>}
      <p className="flex-1 text-sm leading-relaxed text-muted-foreground italic">&ldquo;{comment}&rdquo;</p>

      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 text-xs font-bold text-white shadow-sm">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-foreground">{guestName}</p>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <p className="text-xs text-muted-foreground">
              {propertyName ? `${propertyName}` : "Everloft Guest"}
              {stayMonth ? ` • ${stayMonth}` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
