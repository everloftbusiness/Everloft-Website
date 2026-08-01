"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Wifi, KeyRound, ShieldAlert } from "lucide-react";
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
import { DashboardHero, DashboardSection, KpiGrid, DataTable } from "@/components/dashboard/dashboard-ui";
import { formatCurrency } from "@/lib/format";

// Ported from screens/dashboard/code/widgets/roles/guest.widget.js — single demo booking record.
const UPCOMING = {
  propertyName: "Everloft Marari Cove",
  location: "Marari Beach, Alappuzha",
  checkInDate: new Date(Date.now() + 2 * 86400000),
  checkOutDate: new Date(Date.now() + 5 * 86400000),
  guests: 3,
  paymentStatus: "Paid",
  hostContact: "+91 74832 70264",
  mapLink: "https://maps.google.com/?q=Marari+Beach+Alappuzha",
  bookingAmount: 18750,
  paidAmount: 18750,
  instructions: {
    entryInstructions: "Main gate self-check-in kiosk near reception.",
    doorLockCode: "8426#",
    wifiName: "Everloft-Guest",
    wifiPassword: "Stay@Everloft",
    parkingInstructions: "Use slot B-14 and display guest parking slip.",
    houseRules: "No loud music after 10 PM. No smoking indoors.",
    emergencyContact: "+91 94470 22110",
  },
};

const HISTORY = [
  { propertyName: "Everloft Kadavanthra Suites", checkInDate: "2025-12-18", checkOutDate: "2025-12-21", amount: 14200, status: "Completed", invoiceNumber: "INV-8891" },
  { propertyName: "Everloft Wayanad Ridge", checkInDate: "2025-09-03", checkOutDate: "2025-09-06", amount: 16600, status: "Completed", invoiceNumber: "INV-8450" },
];

const PAYMENTS = [
  { date: new Date(Date.now() - 2 * 86400000), mode: "UPI", amount: 12000, status: "Success", reference: "UPI-529821" },
  { date: new Date(Date.now() - 3 * 86400000), mode: "Card", amount: 6750, status: "Success", reference: "CRD-119204" },
];

function getCountdownLabel() {
  const diffDays = Math.round((UPCOMING.checkInDate.getTime() - Date.now()) / 86400000);
  if (diffDays > 1) return `${diffDays} days to your stay`;
  if (diffDays === 1) return "1 day to your stay";
  if (diffDays === 0) return "Today is your check-in day";
  return "Stay in progress";
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function GuestDashboard({ userName }: { userName: string }) {
  const [rating, setRating] = useState("5");
  const [feedback, setFeedback] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const canCheckin = isSameDay(new Date(), UPCOMING.checkInDate);
  const canReview = useMemo(() => new Date(HISTORY[0].checkOutDate) < new Date(), []);

  function quickAction(message: string) {
    toast.success(`${message} Team will respond shortly.`);
  }

  function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!feedback.trim()) {
      toast.error("Please add a short note about your stay.");
      return;
    }
    setReviewSubmitted(true);
    toast.success("Thank you — your feedback has been recorded.");
  }

  return (
    <>
      <DashboardHero eyebrow="Your Stay" userName={userName} description="Everything you need for your Everloft stay, in one place." />

      <DashboardSection title="Upcoming Stay">
        <KpiGrid
          items={[
            { label: "Property", value: UPCOMING.propertyName, note: UPCOMING.location },
            { label: "Check-in", value: UPCOMING.checkInDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), note: "Arrival date" },
            { label: "Check-out", value: UPCOMING.checkOutDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), note: "Departure date" },
            { label: "Countdown", value: getCountdownLabel(), note: `${UPCOMING.guests} guests` },
          ]}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <a href={UPCOMING.mapLink} target="_blank" rel="noopener noreferrer">
              <MapPin className="h-3.5 w-3.5" /> Open Google Maps
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/properties">View Property Details</Link>
          </Button>
        </div>
      </DashboardSection>

      <DashboardSection title="Check-in Instructions">
        {canCheckin ? (
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-gold" /> Door code: <strong>{UPCOMING.instructions.doorLockCode}</strong></p>
            <p className="flex items-center gap-2"><Wifi className="h-4 w-4 text-gold" /> WiFi: <strong>{UPCOMING.instructions.wifiName}</strong> / {UPCOMING.instructions.wifiPassword}</p>
            <p className="sm:col-span-2 text-muted-foreground">{UPCOMING.instructions.entryInstructions}</p>
            <p className="sm:col-span-2 text-muted-foreground">{UPCOMING.instructions.parkingInstructions}</p>
            <p className="sm:col-span-2 text-muted-foreground">{UPCOMING.instructions.houseRules}</p>
            <p className="flex items-center gap-2 text-destructive"><ShieldAlert className="h-4 w-4" /> Emergency: {UPCOMING.instructions.emergencyContact}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Instructions will be available on your arrival date.</p>
        )}
      </DashboardSection>

      <DashboardSection title="Booking History">
        <DataTable
          headers={["Property", "Dates", "Amount", "Status", "Invoice"]}
          rows={HISTORY.map((h) => [
            h.propertyName,
            `${h.checkInDate} – ${h.checkOutDate}`,
            formatCurrency(h.amount),
            h.status,
            h.invoiceNumber,
          ])}
        />
      </DashboardSection>

      <DashboardSection title="Support &amp; Help">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => quickAction("Cleaning request sent.")}>Request Cleaning</Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => quickAction("Maintenance issue logged.")}>Report Maintenance Issue</Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => quickAction("Early check-in request submitted.")}>Early Check-in Request</Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => quickAction("Late checkout request submitted.")}>Late Checkout Request</Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => quickAction("Support callback requested.")}>Contact Support</Button>
        </div>
      </DashboardSection>

      <DashboardSection title="Invoices &amp; Payments">
        <KpiGrid
          items={[
            { label: "Total", value: formatCurrency(UPCOMING.bookingAmount), note: "Current booking" },
            { label: "Paid", value: formatCurrency(UPCOMING.paidAmount), note: "Received" },
            { label: "Pending", value: formatCurrency(0), note: "Fully settled" },
          ]}
        />
        <div className="mt-6">
          <DataTable
            headers={["Date", "Mode", "Amount", "Status", "Reference"]}
            rows={PAYMENTS.map((p) => [
              p.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
              p.mode,
              formatCurrency(p.amount),
              p.status,
              p.reference,
            ])}
          />
        </div>
      </DashboardSection>

      <DashboardSection title="Review &amp; Feedback">
        {!canReview ? (
          <p className="text-sm text-muted-foreground">Reviews open after your stay is complete.</p>
        ) : reviewSubmitted ? (
          <p className="text-sm text-primary">Thank you for your feedback!</p>
        ) : (
          <form onSubmit={submitReview} className="space-y-4 max-w-md">
            <div>
              <Label className="mb-1.5">Rating</Label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <SelectItem key={r} value={String(r)}>{r} / 5</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="feedback" className="mb-1.5">Feedback</Label>
              <Textarea id="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} />
            </div>
            <Button type="submit" variant="gold" className="rounded-full">Submit Review</Button>
          </form>
        )}
      </DashboardSection>

      <DashboardSection title="Profile Settings">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Profile updated.");
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl"
        >
          <div>
            <Label htmlFor="name" className="mb-1.5">Name</Label>
            <Input id="name" defaultValue={userName} />
          </div>
          <div>
            <Label htmlFor="phone" className="mb-1.5">Phone</Label>
            <Input id="phone" type="tel" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="outline" className="rounded-full">Save Profile</Button>
          </div>
        </form>
      </DashboardSection>
    </>
  );
}
