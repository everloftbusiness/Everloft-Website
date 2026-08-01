import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceAlert } from "@/lib/dashboard/workspaces";

export function DashboardHero({
  eyebrow,
  userName,
  description,
}: {
  eyebrow: string;
  userName: string;
  description: string;
}) {
  return (
    <header className="mb-8 rounded-2xl border border-border bg-card p-8">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h1 className="heading-display text-2xl sm:text-3xl">
        Welcome, <span>{userName}</span>
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
    </header>
  );
}

export function DashboardSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-8 rounded-2xl border border-border bg-card p-6 sm:p-8", className)}>
      <h2 className="mb-5 text-lg font-bold text-primary">{title}</h2>
      {children}
    </section>
  );
}

export function KpiGrid({ items }: { items: { label: string; value: string; note: string }[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border bg-soft p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-2xl font-bold text-primary">{item.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
        </div>
      ))}
    </div>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="table-wrap overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {headers.map((h) => (
              <th key={h} className="pb-3 pr-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="py-6 text-center text-muted-foreground">
                No records found.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className="py-3 pr-4 text-foreground/85">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const ALERT_ICON = { info: Info, warning: AlertTriangle, critical: ShieldAlert };
const ALERT_STYLE = {
  info: "border-blue-accent/30 bg-blue-accent/5 text-blue-accent",
  warning: "border-gold/40 bg-gold-soft text-foreground",
  critical: "border-destructive/40 bg-destructive/5 text-destructive",
};

export function AlertsStrip({ alerts }: { alerts: WorkspaceAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="mb-8 space-y-3">
      {alerts.map((alert, i) => {
        const Icon = ALERT_ICON[alert.type];
        return (
          <div
            key={i}
            className={cn("flex items-start gap-3 rounded-xl border p-4 text-sm", ALERT_STYLE[alert.type])}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            {alert.text}
          </div>
        );
      })}
    </div>
  );
}

export function StatusChip({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        done ? "bg-green-100 text-green-700" : "bg-gold-soft text-foreground/70"
      )}
    >
      {label}
    </span>
  );
}
