"use client";

import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/format";

const MANAGEMENT_FEE_PCT = 0.2;

export function RevenueCalculator() {
  const [nightlyRate, setNightlyRate] = useState([18000]);
  const [occupancy, setOccupancy] = useState([65]);

  const monthlyGross = useMemo(
    () => (nightlyRate[0] * 30 * occupancy[0]) / 100,
    [nightlyRate, occupancy]
  );
  const monthlyNet = monthlyGross * (1 - MANAGEMENT_FEE_PCT);
  const annualNet = monthlyNet * 12;

  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <h3 className="mb-8 text-lg font-bold text-primary">Estimate your earnings</h3>

      <div className="space-y-8">
        <div>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground/80">Average nightly rate</span>
            <span className="font-bold text-primary">{formatCurrency(nightlyRate[0])}</span>
          </div>
          <Slider value={nightlyRate} onValueChange={setNightlyRate} min={5000} max={80000} step={1000} />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground/80">Expected occupancy</span>
            <span className="font-bold text-primary">{occupancy[0]}%</span>
          </div>
          <Slider value={occupancy} onValueChange={setOccupancy} min={20} max={95} step={5} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Est. monthly payout</p>
          <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(monthlyNet)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Est. annual payout</p>
          <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(annualNet)}</p>
        </div>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">
        Illustrative estimate after an indicative {MANAGEMENT_FEE_PCT * 100}% management fee.
        Your actual quote depends on property type, location, and season — book a consultation
        for exact numbers.
      </p>
    </div>
  );
}
