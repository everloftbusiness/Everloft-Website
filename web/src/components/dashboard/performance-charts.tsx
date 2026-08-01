"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export function PerformanceCharts({
  periods,
  revenue,
  occupancy,
}: {
  periods: string[];
  revenue: number[];
  occupancy: number[];
}) {
  const data = periods.map((period, i) => ({
    period,
    revenue: revenue[i],
    occupancy: occupancy[i],
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="h-64 rounded-xl border border-border p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue Trend</p>
        <ResponsiveContainer width="100%" height="88%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB" }} />
            <Bar dataKey="revenue" fill="#0F172A" radius={[6, 6, 0, 0]} maxBarSize={36} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64 rounded-xl border border-border p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Occupancy %</p>
        <ResponsiveContainer width="100%" height="88%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB" }} />
            <Line type="monotone" dataKey="occupancy" stroke="#D4AF37" strokeWidth={2.5} dot={{ r: 3.5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
