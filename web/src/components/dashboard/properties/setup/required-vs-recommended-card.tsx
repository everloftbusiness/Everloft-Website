export function RequiredVsRecommendedCard({
  requiredDone,
  requiredTotal,
  recommendedDone,
  recommendedTotal,
}: {
  requiredDone: number;
  requiredTotal: number;
  recommendedDone: number;
  recommendedTotal: number;
}) {
  const row = (label: string, done: number, total: number, colorClass: string) => (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-primary">{label}</span>
        <span className="text-muted-foreground">
          {done} / {total} Completed
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-[width] duration-400 ease-out ${colorClass}`}
          style={{ width: `${total === 0 ? 100 : Math.round((done / total) * 100)}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <p className="text-sm font-bold text-primary">Required vs. Recommended</p>
      {row("Required", requiredDone, requiredTotal, "bg-primary")}
      {row("Recommended", recommendedDone, recommendedTotal, "bg-gold")}
    </div>
  );
}
