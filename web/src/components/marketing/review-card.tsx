import Image from "next/image";
import { Star, Quote, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewCard({
  guestName,
  rating,
  title,
  comment,
  stayMonth,
  propertyName,
  propertyImage,
  guestCity,
  className,
}: {
  guestName: string;
  rating: number;
  title?: string | null;
  comment: string;
  stayMonth?: string | null;
  propertyName?: string;
  propertyImage?: string;
  guestCity?: string;
  className?: string;
}) {
  const initials = guestName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  const fallbackPhoto = "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80";

  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-md",
        className
      )}
    >
      <div>
        {/* Header: Guest Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-sm ring-2 ring-emerald-500/30">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-foreground">{guestName}</p>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <p className="text-xs text-muted-foreground">{guestCity || propertyName || "Everloft Guest"}</p>
          </div>
        </div>

        {/* Rating Stars */}
        <div className="flex gap-1 mb-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn("h-3.5 w-3.5", i < rating ? "fill-amber-500 text-amber-500" : "text-border")}
            />
          ))}
        </div>

        {title && <h4 className="mb-1 text-sm font-bold text-foreground">{title}</h4>}
        <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-4">
          &ldquo;{comment}&rdquo;
        </p>
      </div>

      {/* Property Thumbnail at bottom of review card (from reference design) */}
      <div className="mt-4 pt-3 border-t border-border/60">
        <div className="relative h-24 sm:h-28 w-full overflow-hidden rounded-xl bg-slate-100">
          <Image
            src={propertyImage || fallbackPhoto}
            alt={propertyName || "Everloft Stay"}
            fill
            unoptimized
            className="object-cover"
          />
          {propertyName && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
              <span className="text-[11px] font-semibold text-white truncate drop-shadow">{propertyName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
