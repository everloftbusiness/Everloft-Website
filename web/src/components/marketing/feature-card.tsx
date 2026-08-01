import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(15,23,42,0.15)]",
        className
      )}
    >
      <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white transition-colors duration-300 group-hover:bg-gold group-hover:text-gold-foreground">
        <Icon className="h-5.5 w-5.5" strokeWidth={1.5} />
      </div>
      <h3 className="mb-2.5 text-lg font-bold text-primary">{title}</h3>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
