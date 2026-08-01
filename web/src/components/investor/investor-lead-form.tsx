"use client";

import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RANGES = ["₹10L – ₹25L", "₹25L – ₹50L", "₹50L – ₹1Cr", "₹1Cr+"];

export function InvestorLeadForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [investmentRange, setInvestmentRange] = useState(RANGES[0]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = { ...Object.fromEntries(form), investmentRange };
    try {
      const res = await fetch("/api/investor-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      toast.success("Thank you — our investment team will follow up within 2 business days.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold-soft p-8 text-center">
        <p className="text-lg font-bold text-primary">Thank you for your interest</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Our investment team will reach out within 2 business days with next steps.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" className="mb-1.5">Full name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="phone" className="mb-1.5">Phone</Label>
          <Input id="phone" name="phone" type="tel" required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="email" className="mb-1.5">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-1.5">Investment range</Label>
          <Select value={investmentRange} onValueChange={setInvestmentRange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="message" className="mb-1.5">Message (optional)</Label>
          <Textarea id="message" name="message" rows={3} />
        </div>
      </div>
      <Button type="submit" variant="gold" size="xl" className="w-full rounded-xl" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Request Investor Deck
      </Button>
    </form>
  );
}
