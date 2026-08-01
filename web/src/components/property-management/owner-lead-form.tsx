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

export function OwnerLeadForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [propertyType, setPropertyType] = useState("Villa");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = { ...Object.fromEntries(form), propertyType };
    try {
      const res = await fetch("/api/owner-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      toast.success("Thank you — our team will reach out within 1 business day.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold-soft p-8 text-center">
        <p className="text-lg font-bold text-primary">Request received</p>
        <p className="mt-2 text-sm text-muted-foreground">
          A member of our property management team will contact you shortly to schedule your
          consultation.
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
        <div>
          <Label htmlFor="city" className="mb-1.5">Property city</Label>
          <Input id="city" name="city" required />
        </div>
        <div>
          <Label htmlFor="propertyType" className="mb-1.5">Property type</Label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger className="w-full" id="propertyType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Villa", "Apartment", "Holiday Home", "Boutique Stay", "Penthouse", "Luxury Home"].map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="message" className="mb-1.5">Tell us about your property (optional)</Label>
          <Textarea id="message" name="message" rows={3} />
        </div>
      </div>
      <Button type="submit" variant="gold" size="xl" className="w-full rounded-xl" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Schedule Consultation
      </Button>
    </form>
  );
}
