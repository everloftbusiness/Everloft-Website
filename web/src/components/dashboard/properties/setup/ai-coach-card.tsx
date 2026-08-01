import { Sparkles } from "lucide-react";
import type { CoachRecommendation } from "@/features/properties/services/onboarding.service";

const PRIORITY_STYLE = {
  high: "border-destructive/30 bg-destructive/5 text-destructive",
  medium: "border-gold/40 bg-gold-soft text-foreground",
  low: "border-blue-accent/30 bg-blue-accent/5 text-blue-accent",
};

export function AiCoachCard({ recommendations }: { recommendations: CoachRecommendation[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="mb-4 flex items-center gap-2 text-sm font-bold text-primary">
        <Sparkles className="h-4 w-4 text-gold" /> AI Property Coach
      </p>
      {recommendations.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to suggest right now — this listing looks strong.</p>
      ) : (
        <ul className="space-y-3">
          {recommendations.map((r, i) => (
            <li key={i} className={`rounded-xl border p-3 text-xs ${PRIORITY_STYLE[r.priority]}`}>
              <p className="font-semibold">{r.reason}</p>
              <p className="mt-1 opacity-90">{r.action}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
