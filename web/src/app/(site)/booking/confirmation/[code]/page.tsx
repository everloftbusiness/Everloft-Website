import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Calendar,
  Users,
  Mail,
  MessageCircle,
  MapPin,
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
  title: "Booking Confirmed",
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
    `Hi Everloft, I'd like help with my reservation ${booking.reservationCode} at ${booking.property.name}.`
  );

  return (
    <div className="site-container max-w-3xl pt-32 pb-24">
      <Reveal className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft">
          <CheckCircle2 className="h-9 w-9 text-gold" strokeWidth={1.5} />
        </div>
        <p className="eyebrow mb-3 justify-center">Booking Confirmed</p>
        <h1 className="heading-display text-3xl sm:text-4xl">You&apos;re all set, {booking.guestName.split(" ")[0]}</h1>
        <p className="mt-3 text-muted-foreground">
          Reservation ID <span className="font-semibold text-primary">{booking.reservationCode}</span>
        </p>
      </Reveal>

      <Reveal className="mt-12 rounded-2xl border border-border bg-card p-8">
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
            <p className="text-xs text-muted-foreground">Total paid</p>
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
            <a href={`/api/bookings/${booking.reservationCode}/calendar`}>
              <Calendar className="h-4 w-4" /> Add to Calendar
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <a href={`https://wa.me/919999999999?text=${whatsappText}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> WhatsApp Support
            </a>
          </Button>
        </div>

        <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5" /> A confirmation has been sent to {booking.guestEmail}
        </p>
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
