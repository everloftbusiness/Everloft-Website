"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import {
  ShieldCheck,
  Loader2,
  Tag,
  Send,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PropertyMedia } from "@/components/media/property-media";
import { DateRangePicker } from "@/components/booking/date-range-picker";
import { GuestSelector } from "@/components/booking/guest-selector";
import { Turnstile } from "@/components/security/turnstile";
import { formatCurrency, formatDateRange, nightsBetween } from "@/lib/format";

const PROMO_COUPONS: Record<string, number> = {
  EVERLOFT10: 0.1,
  WELCOME5: 0.05,
};

export function BookingFlow({
  property,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: {
  property: {
    slug: string;
    name: string;
    type: string;
    heroImage: string;
    city: string;
    pricePerNight: number;
    cleaningFee: number;
    serviceFeePct: number;
    currency: string;
    guests: number;
  };
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);

  const [range, setRange] = useState<DateRange | undefined>(
    initialCheckIn && initialCheckOut
      ? { from: new Date(initialCheckIn), to: new Date(initialCheckOut) }
      : undefined
  );
  const [guests, setGuests] = useState(initialGuests ?? 2);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const nights = range?.from && range?.to ? nightsBetween(range.from, range.to) : 0;
  const subtotal = nights * property.pricePerNight;
  const serviceFee = Math.round(subtotal * property.serviceFeePct);
  const discountPct = appliedCoupon ? PROMO_COUPONS[appliedCoupon] ?? 0 : 0;
  const discount = Math.round(subtotal * discountPct);
  const total = subtotal + (nights > 0 ? property.cleaningFee : 0) + serviceFee - discount;

  const canSubmit = useMemo(
    () =>
      !!range?.from &&
      !!range?.to &&
      guestName.trim().length > 1 &&
      !!guestEmail &&
      !!guestPhone &&
      agreed,
    [range, guestName, guestEmail, guestPhone, agreed]
  );

  function applyCoupon() {
    const key = couponInput.toUpperCase().trim();
    if (PROMO_COUPONS[key]) {
      setAppliedCoupon(key);
      toast.success(`Coupon ${key} applied`);
    } else {
      toast.error("Invalid or expired coupon code");
    }
  }

  async function handleSubmitEnquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!range?.from || !range?.to || !canSubmit) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertySlug: property.slug,
          checkIn: range.from.toISOString(),
          checkOut: range.to.toISOString(),
          guests,
          guestName,
          guestEmail,
          guestPhone,
          specialRequests,
          couponCode: appliedCoupon ?? undefined,
          captchaToken,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Enquiry submission failed");
      }

      const { reservationCode } = await res.json();
      router.push(`/booking/confirmation/${reservationCode}`);
    } catch (err) {
      setTurnstileKey((k) => k + 1);
      setCaptchaToken("");
      toast.error(
        err instanceof Error ? err.message : "Something went wrong submitting your enquiry. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="site-container grid gap-12 pt-28 pb-24 lg:grid-cols-[1fr_380px]">
      <div>
        <h1 className="heading-display mb-3 text-2xl sm:text-3xl">Reserve your stay</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Submit a direct booking enquiry. Our reservations concierge will review your requested dates,
          confirm availability, and provide secure settlement instructions.
        </p>

        <form onSubmit={handleSubmitEnquiry} className="space-y-8">
          <div>
            <h2 className="mb-4 text-lg font-bold text-primary">Your stay</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DateRangePicker range={range} onChange={setRange} />
              <GuestSelector guests={guests} onChange={setGuests} maxGuests={property.guests} />
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold text-primary">Guest details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="guestName" className="mb-1.5">Full name</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="As per government ID"
                  required
                />
              </div>
              <div>
                <Label htmlFor="guestEmail" className="mb-1.5">Email</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="guestPhone" className="mb-1.5">Phone</Label>
                <Input
                  id="guestPhone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+91 90000 00000"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="specialRequests" className="mb-1.5">Special requests (optional)</Label>
                <Textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Early check-in, celebration setup, dietary preferences…"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-1.5">Promo code</Label>
            <div className="flex gap-2">
              <Input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Enter code"
                className="max-w-xs"
              />
              <Button type="button" variant="outline" onClick={applyCoupon}>
                <Tag className="h-4 w-4" /> Apply
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-2 text-base font-bold text-primary flex items-center gap-2">
              <Info className="h-4 w-4 text-gold" /> Direct Enquiry Process
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Everloft verifies every stay directly with our on-ground property teams. Upon submitting
              your enquiry, your dates are placed on temporary hold. Our team will reach out via WhatsApp
              or phone within 2 hours to confirm details and share payment instructions (direct bank transfer / UPI).
            </p>
          </div>

          <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <Checkbox
              checked={agreed}
              onCheckedChange={(v) => setAgreed(!!v)}
              className="mt-0.5"
            />
            I agree to Everloft&apos;s <a href="/terms" className="text-primary underline">Terms of Service</a> and{" "}
            <a href="/privacy" className="text-primary underline">Cancellation Policy</a>.
          </label>

          <Turnstile
            key={turnstileKey}
            action="booking_request"
            onVerify={setCaptchaToken}
          />

          <Button
            type="submit"
            size="xl"
            variant="gold"
            className="w-full rounded-xl sm:w-auto"
            disabled={!canSubmit || submitting || (Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !captchaToken)}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit Booking Enquiry
          </Button>
        </form>
      </div>

      <aside className="lg:sticky lg:top-28">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex gap-3">
            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg">
              <PropertyMedia seed={property.heroImage} type={property.type} showIcon={false} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">{property.name}</p>
              <p className="text-xs text-muted-foreground">{property.city}</p>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Dates</span>
              <span className="font-medium text-primary">
                {range?.from && range?.to ? formatDateRange(range.from, range.to) : "Not selected"}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Guests</span>
              <span className="font-medium text-primary">{guests}</span>
            </div>
          </div>

          {nights > 0 && (
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{formatCurrency(property.pricePerNight, property.currency)} × {nights} nights</span>
                <span>{formatCurrency(subtotal, property.currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Cleaning fee</span>
                <span>{formatCurrency(property.cleaningFee, property.currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Service fee</span>
                <span>{formatCurrency(serviceFee, property.currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-gold">
                  <span>Coupon ({appliedCoupon})</span>
                  <span>-{formatCurrency(discount, property.currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base font-bold text-primary">
                <span>Estimated Total (inc. GST)</span>
                <span>{formatCurrency(total, property.currency)}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Settled offline after reservation confirmation.
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-4">
            <ShieldCheck className="h-4 w-4 text-gold shrink-0" />
            <span>Guaranteed direct reservation directly managed by Everloft.</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
