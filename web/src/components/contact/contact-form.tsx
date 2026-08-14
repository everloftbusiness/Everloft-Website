"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const searchParams = useSearchParams();
  const propertyParam = searchParams.get("property");

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (propertyParam) {
      setSubject(`Inquiry for ${propertyParam}`);
      setMessage(`Hi Everloft team, I'd like to check availability and booking details for "${propertyParam}".`);
    }
  }, [propertyParam]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      toast.success("Message sent — we'll be in touch shortly.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-8 text-center">
        <p className="text-lg font-bold text-foreground">Message received</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Our concierge team typically responds within a few minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
      {propertyParam && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 p-3 text-xs text-emerald-900 dark:text-emerald-300">
          <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Inquiring for: <strong>{propertyParam}</strong></span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" className="mb-1.5">Full name</Label>
          <Input id="name" name="name" required placeholder="Your name" />
        </div>
        <div>
          <Label htmlFor="phone" className="mb-1.5">Phone (optional)</Label>
          <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="email" className="mb-1.5">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="subject" className="mb-1.5">Subject</Label>
          <Input
            id="subject"
            name="subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Booking inquiry / Question"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="message" className="mb-1.5">Message</Label>
          <Textarea
            id="message"
            name="message"
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we help?"
          />
        </div>
      </div>
      <Button type="submit" size="xl" className="w-full rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold h-12 shadow-md" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Send Inquiry
      </Button>
    </form>
  );
}
