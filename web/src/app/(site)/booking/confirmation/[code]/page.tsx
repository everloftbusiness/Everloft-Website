import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Users,
  MessageCircle,
  MapPin,
  Clock,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyMedia } from "@/components/media/property-media";
import { PropertyCard } from "@/components/property/property-card";
import { PrintButton } from "@/components/booking/print-button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { getBookingByCode } from "@/lib/bookings";
import { getProperties } from "@/lib/properties";
import { formatCurrency, formatDateRange } from "@/lib/format";

export const metadata: Metadata = {
  title: "Booking Enquiry Received",
  robots: { index: false },
};

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const booking = await getBookingByCode(code);
  if (!booking) notFound();

  const moreProperties = (await getProperties()).filter((p) => p.id !== booking.propertyId).slice(0, 3);

  const whatsappText = encodeURIComponent(
    `Hi Everloft, I submitted a booking enquiry ${booking.reservationCode} for ${booking.property.name}.`
  );

  return (
    <div className="site-container max-w-3xl pt-32 pb-24">
      <Reveal className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft">
          <Clock className="h-9 w-9 text-gold" strokeWidth={1.5} />
        </div>
        <p className="eyebrow mb-3 justify-center">Enquiry Received</p>
        <h1 className="heading-display text-3xl sm:text-4xl">
          Request received, {booking.guestName.split(" ")[0]}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Enquiry Reference <span className="font-semibold text-primary">{booking.reservationCode}</span>
        </p>
      </Reveal>

      <Reveal className="mt-8 rounded-2xl border border-gold/40 bg-gold-soft p-5 text-sm text-foreground/90">
        <p className="font-semibold flex items-center gap-2 text-primary">
          <Check className="h-4 w-4 text-gold" /> What happens next?
        </p>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Your requested stay dates are on hold. Our reservations concierge is reviewing property
          availability and will reach out via WhatsApp/phone within 2 hours to confirm your booking and
          share direct payment instructions (bank transfer / UPI).
        </p>
      </Reveal>

      <Reveal className="mt-8 rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
          <div className="flex gap-4">
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl">
              <PropertyMedia seed={booking.property.heroImage} type={booking.property.type} showIcon={false} />
            </div>
            <div>
              <p className="text-base font-bold text-primary">{booking.property.name}</p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {booking.property.city}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{formatCurrency(booking.total, booking.currency)}</p>
            <p className="text-xs text-muted-foreground">Estimated Total (inc. GST)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 py-6 sm:grid-cols-3">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Dates
            </p>
            <p className="text-sm font-medium text-primary">
              {formatDateRange(booking.checkIn, booking.checkOut)}
            </p>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Guests
            </p>
            <p className="text-sm font-medium text-primary">{booking.guests} guests</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Guest details
            </p>
            <p className="text-sm font-medium text-primary">{booking.guestName}</p>
            <p className="text-xs text-muted-foreground">{booking.guestEmail}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-6">
          <PrintButton />
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <a href={`https://wa.me/917483270264?text=${whatsappText}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> WhatsApp Support
            </a>
          </Button>
        </div>
      </Reveal>

      {moreProperties.length > 0 && (
        <div className="mt-16">
          <h2 className="heading-display mb-8 text-2xl">Explore more stays</h2>
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {moreProperties.map((p) => (
              <RevealItem key={p.id}>
                <PropertyCard property={p} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      )}

      <div className="mt-12 text-center">
        <Button asChild variant="ghost" size="lg">
          <Link href="/properties">Browse all properties</Link>
        </Button>
      </div>
    </div>
  );
}
