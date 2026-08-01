import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getPropertyBySlug } from "@/lib/properties";

export const metadata: Metadata = {
  title: "Complete Your Booking",
  robots: { index: false },
};

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const get = (key: string) => (Array.isArray(sp[key]) ? sp[key]?.[0] : sp[key]);

  return (
    <BookingFlow
      property={{
        slug: property.slug,
        name: property.name,
        type: property.type,
        heroImage: property.heroImage,
        city: property.city,
        pricePerNight: property.pricePerNight,
        cleaningFee: property.cleaningFee,
        serviceFeePct: property.serviceFeePct,
        currency: property.currency,
        guests: property.guests,
      }}
      initialCheckIn={get("checkIn")}
      initialCheckOut={get("checkOut")}
      initialGuests={get("guests") ? Number(get("guests")) : undefined}
    />
  );
}
