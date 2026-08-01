import { AnimatedCounter } from "@/components/marketing/animated-counter";

export function StatCard({
  value,
  suffix,
  prefix,
  label,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="font-sans text-4xl font-bold tracking-tight text-current md:text-5xl">
        <AnimatedCounter value={value} suffix={suffix} prefix={prefix} />
      </div>
      <p className="mt-2 text-sm text-current/60 md:text-base">{label}</p>
    </div>
  );
}
