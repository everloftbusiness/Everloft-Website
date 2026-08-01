import { Star, Quote } from "lucide-react";
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
        "flex h-full flex-col rounded-2xl border border-border bg-card p-8 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.25)]",
        className
      )}
    >
      <Quote className="mb-4 h-7 w-7 text-gold/70" strokeWidth={1.5} />
      <div className="mb-3 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn("h-4 w-4", i < rating ? "fill-gold text-gold" : "text-border")}
          />
        ))}
      </div>
      {title && <h3 className="mb-2 text-base font-bold text-primary">{title}</h3>}
      <p className="flex-1 text-[15px] leading-relaxed text-muted-foreground">{comment}</p>
      <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">{guestName}</p>
          <p className="text-xs text-muted-foreground">
            {propertyName ? `${propertyName} · ` : ""}
            {stayMonth}
          </p>
        </div>
      </div>
    </div>
  );
}
