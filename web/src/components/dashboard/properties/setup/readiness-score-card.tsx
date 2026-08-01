import { ProgressRing } from "./progress-ring";

export function ReadinessScoreCard({
  score,
  breakdown,
}: {
  score: number;
  breakdown: { label: string; percent: number }[];
}) {
  const message = score >= 85 ? "Ready to publish" : score >= 60 ? "Almost there" : "Needs work";

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="mb-4 text-sm font-bold text-primary">Readiness Score</p>
      <div className="flex items-center gap-5">
        <ProgressRing percent={score} size={96} strokeWidth={8} label="" colorClassName={score >= 85 ? "stroke-green-600" : "stroke-gold"} />
        <div>
          <p className="text-lg font-bold text-primary">{score}/100</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2.5">
        {breakdown.map((b) => (
          <li key={b.label} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{b.label}</span>
            <span className="font-semibold text-primary">{b.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
