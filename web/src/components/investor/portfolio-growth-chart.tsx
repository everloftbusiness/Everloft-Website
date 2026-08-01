"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { year: "2023", properties: 2, revenue: 0.6 },
  { year: "2024", properties: 4, revenue: 1.4 },
  { year: "2025", properties: 6, revenue: 2.3 },
  { year: "2026", properties: 8, revenue: 3.4 },
];

export function PortfolioGrowthChart() {
  return (
    <div className="h-72 w-full rounded-2xl border border-border bg-card p-6">
      <p className="mb-4 text-sm font-semibold text-primary">Portfolio growth (illustrative)</p>
      <ResponsiveContainer width="100%" height="88%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [`₹${Number(value ?? 0)} Cr`, "Portfolio revenue"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB" }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#colorRevenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
