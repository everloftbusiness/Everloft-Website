"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const data = [
  { type: "Villas", count: 3 },
  { type: "Holiday Homes", count: 2 },
  { type: "Apartments", count: 1 },
  { type: "Penthouse", count: 1 },
  { type: "Boutique", count: 1 },
];

const COLORS = ["#0F172A", "#1E293B", "#2563EB", "#64748B", "#D4AF37"];

export function PortfolioMixChart() {
  return (
    <div className="h-72 w-full rounded-2xl border border-border bg-card p-6">
      <p className="mb-4 text-sm font-semibold text-primary">Portfolio mix by property type</p>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis dataKey="type" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB" }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
