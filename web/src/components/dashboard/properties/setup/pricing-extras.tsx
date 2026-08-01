"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  addDiscountAction,
  removeDiscountAction,
  addFeeAction,
  removeFeeAction,
  addTaxAction,
  removeTaxAction,
} from "@/features/properties/actions/onboarding.actions";

// --- Discounts ---
const DISCOUNT_TYPES = [
  { value: "last_minute", label: "Last-minute discount" },
  { value: "early_bird", label: "Early bird discount" },
  { value: "non_refundable", label: "Non-refundable discount" },
  { value: "long_stay", label: "Long stay discount" },
  { value: "repeat_guest", label: "Repeat guest discount" },
  { value: "promo_coupon", label: "Promotional coupon" },
  { value: "first_booking", label: "First booking discount" },
  { value: "seasonal_promo", label: "Seasonal promotion" },
] as const;

export type DiscountRow = { id: string; discountType: string; valuePercent: number; couponCode: string | null };

export function DiscountsManager({ propertyId, discounts }: { propertyId: string; discounts: DiscountRow[] }) {
  const router = useRouter();
  const [type, setType] = useState<string>(DISCOUNT_TYPES[0].value);
  const [percent, setPercent] = useState("");
  const [coupon, setCoupon] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!percent) return;
    setSaving(true);
    try {
      await addDiscountAction(propertyId, { discountType: type as (typeof DISCOUNT_TYPES)[number]["value"], valuePercent: Number(percent), couponCode: coupon || undefined });
      setPercent("");
      setCoupon("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    await removeDiscountAction(propertyId, id);
    router.refresh();
  }

  return (
    <div className="space-y-3 border-t border-border pt-5">
      <p className="text-sm font-semibold text-primary">Discounts</p>
      {discounts.map((d) => (
        <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
          <span>
            {DISCOUNT_TYPES.find((t) => t.value === d.discountType)?.label ?? d.discountType} — {d.valuePercent}%
            {d.couponCode ? ` (code: ${d.couponCode})` : ""}
          </span>
          <button type="button" onClick={() => handleRemove(d.id)} className="text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap items-end gap-2">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DISCOUNT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={percent} onChange={(e) => setPercent(e.target.value)} type="number" min={0} max={100} placeholder="%" className="w-24" />
        {type === "promo_coupon" && (
          <Input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" className="w-36" />
        )}
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add
        </Button>
      </div>
    </div>
  );
}

// --- Fees ---
const FEE_TYPES = [
  { value: "linen", label: "Linen fee" },
  { value: "laundry", label: "Laundry fee" },
  { value: "resort", label: "Resort fee" },
  { value: "service", label: "Service fee" },
  { value: "utility", label: "Utility fee" },
  { value: "damage_waiver", label: "Damage waiver" },
  { value: "late_checkout", label: "Late check-out fee" },
  { value: "early_checkin", label: "Early check-in fee" },
  { value: "extra_bed", label: "Extra bed fee" },
] as const;

export type FeeRow = { id: string; feeType: string; amount: number; isPercentage: boolean };

export function FeesManager({ propertyId, fees }: { propertyId: string; fees: FeeRow[] }) {
  const router = useRouter();
  const [type, setType] = useState<string>(FEE_TYPES[0].value);
  const [amount, setAmount] = useState("");
  const [isPercentage, setIsPercentage] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!amount) return;
    setSaving(true);
    try {
      await addFeeAction(propertyId, { feeType: type as (typeof FEE_TYPES)[number]["value"], amount: Number(amount), isPercentage });
      setAmount("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    await removeFeeAction(propertyId, id);
    router.refresh();
  }

  return (
    <div className="space-y-3 border-t border-border pt-5">
      <p className="text-sm font-semibold text-primary">Fees</p>
      {fees.map((f) => (
        <div key={f.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
          <span>
            {FEE_TYPES.find((t) => t.value === f.feeType)?.label ?? f.feeType} — {f.amount}
            {f.isPercentage ? "%" : ""}
          </span>
          <button type="button" onClick={() => handleRemove(f.id)} className="text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FEE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min={0} placeholder="Amount" className="w-28" />
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Checkbox checked={isPercentage} onCheckedChange={(v) => setIsPercentage(v === true)} /> %
        </label>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add
        </Button>
      </div>
    </div>
  );
}

// --- Taxes ---
const TAX_TYPES = [
  { value: "gst", label: "GST" },
  { value: "vat", label: "VAT" },
  { value: "occupancy_tax", label: "Occupancy tax" },
  { value: "luxury_tax", label: "Luxury tax" },
  { value: "other", label: "Other / Local tax" },
] as const;

export type TaxRow = { id: string; taxName: string; taxType: string; ratePercent: number; isInclusive: boolean };

export function TaxesManager({ propertyId, taxes }: { propertyId: string; taxes: TaxRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<string>(TAX_TYPES[0].value);
  const [rate, setRate] = useState("");
  const [isInclusive, setIsInclusive] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name || !rate) return;
    setSaving(true);
    try {
      await addTaxAction(propertyId, { taxName: name, taxType: type as (typeof TAX_TYPES)[number]["value"], ratePercent: Number(rate), isInclusive });
      setName("");
      setRate("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    await removeTaxAction(propertyId, id);
    router.refresh();
  }

  return (
    <div className="space-y-3 border-t border-border pt-5">
      <p className="text-sm font-semibold text-primary">Taxes</p>
      {taxes.map((t) => (
        <div key={t.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
          <span>
            {t.taxName} ({TAX_TYPES.find((x) => x.value === t.taxType)?.label ?? t.taxType}) — {t.ratePercent}% —{" "}
            {t.isInclusive ? "included in price" : "added at checkout"}
          </span>
          <button type="button" onClick={() => handleRemove(t.id)} className="text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kerala Luxury Tax" className="w-44" />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAX_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={rate} onChange={(e) => setRate(e.target.value)} type="number" min={0} max={100} placeholder="%" className="w-20" />
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Checkbox checked={isInclusive} onCheckedChange={(v) => setIsInclusive(v === true)} /> Included in price
        </label>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add
        </Button>
      </div>
    </div>
  );
}
