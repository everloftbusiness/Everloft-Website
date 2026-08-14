import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin, MessageCircle, Clock, ArrowRight } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactOfficeMap } from "@/components/contact/contact-office-map";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Everloft — office, phone, WhatsApp, email, and business hours.",
};

export default function ContactPage() {
  return (
    <div className="site-container max-w-5xl pt-32 pb-24">
      <Reveal className="text-center">
        <p className="eyebrow mb-4 justify-center">Contact</p>
        <h1 className="heading-display text-3xl sm:text-4xl">We&apos;d love to hear from you</h1>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          Whether it&apos;s a booking question or a partnership enquiry, our team responds fast.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <Reveal direction="right" className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-gold" />
              <div>
                <p className="text-sm font-bold text-primary">Office</p>
                <p className="text-sm text-muted-foreground">
                  1st Floor, Bose Nagar, Kadavanthara, Ernakulam, Kerala 682020
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-gold" />
              <div>
                <p className="text-sm font-bold text-primary">Phone</p>
                <a href="tel:+917483270264" className="text-sm text-muted-foreground hover:text-primary">
                  (+91) 748-327-0264
                </a>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-5 w-5 text-gold" />
              <div>
                <p className="text-sm font-bold text-primary">WhatsApp</p>
                <a
                  href="https://wa.me/917483270264"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Chat with us
                </a>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-gold" />
              <div>
                <p className="text-sm font-bold text-primary">Email</p>
                <a href="mailto:everloft.business@gmail.com" className="text-sm text-muted-foreground hover:text-primary">
                  everloft.business@gmail.com
                </a>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-gold" />
              <div>
                <p className="text-sm font-bold text-primary">Business Hours</p>
                <p className="text-sm text-muted-foreground">Mon – Sun, 9:00 AM – 9:00 IST</p>
                <p className="text-xs text-muted-foreground">Guest support is available 24×7.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">Have a quick question?</p>
            <Button asChild variant="outline" size="sm" className="mt-3 rounded-full">
              <Link href="/faq">
                Visit our FAQ <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </Reveal>

        <Reveal direction="left">
          <ContactForm />
        </Reveal>
      </div>

      <Reveal>
        <ContactOfficeMap />
      </Reveal>
    </div>
  );
}
