"use client";

export function ProgressRing({
  percent,
  size = 120,
  strokeWidth = 10,
  label,
  colorClassName = "stroke-primary",
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  colorClassName?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} className="fill-none stroke-border" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`fill-none transition-[stroke-dashoffset] duration-500 ease-out ${colorClassName}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-primary">{percent}%</span>
        </div>
      </div>
      <p className="text-center text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
