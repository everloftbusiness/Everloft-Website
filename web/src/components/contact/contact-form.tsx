"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
      <div className="rounded-2xl border border-gold/40 bg-gold-soft p-8 text-center">
        <p className="text-lg font-bold text-primary">Message received</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Our team typically responds within a few hours during business hours.
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
          <Label htmlFor="phone" className="mb-1.5">Phone (optional)</Label>
          <Input id="phone" name="phone" type="tel" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="email" className="mb-1.5">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="subject" className="mb-1.5">Subject</Label>
          <Input id="subject" name="subject" required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="message" className="mb-1.5">Message</Label>
          <Textarea id="message" name="message" rows={4} required />
        </div>
      </div>
      <Button type="submit" variant="gold" size="xl" className="w-full rounded-xl" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Send Message
      </Button>
    </form>
  );
}
