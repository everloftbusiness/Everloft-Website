import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateReservationCode, nightsBetween } from "@/lib/format";

const DEMO_COUPONS: Record<string, number> = {
  EVERLOFT10: 0.1,
  WELCOME5: 0.05,
};

const bookingSchema = z.object({
  propertySlug: z.string().min(1),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number().int().min(1),
  guestName: z.string().min(2),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(6),
  specialRequests: z.string().optional(),
  couponCode: z.string().optional(),
  paymentProvider: z.enum(["razorpay", "demo"]).default("demo"),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const property = await prisma.property.findUnique({ where: { slug: data.propertySlug } });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }

  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = nights * property.pricePerNight;
  const serviceFee = Math.round(subtotal * property.serviceFeePct);
  const couponKey = data.couponCode?.toUpperCase().trim();
  const discountPct = couponKey ? DEMO_COUPONS[couponKey] ?? 0 : 0;
  const discount = Math.round(subtotal * discountPct);
  const total = subtotal + property.cleaningFee + serviceFee - discount;

  const booking = await prisma.booking.create({
    data: {
      reservationCode: generateReservationCode(),
      propertyId: property.id,
      checkIn,
      checkOut,
      nights,
      guests: data.guests,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      specialRequests: data.specialRequests,
      subtotal,
      cleaningFee: property.cleaningFee,
      serviceFee,
      taxes: 0,
      couponCode: discountPct > 0 ? couponKey : undefined,
      discount,
      total,
      currency: property.currency,
      status: "CONFIRMED",
      paymentStatus: data.paymentProvider === "demo" ? "PAID" : "PENDING",
      paymentProvider: data.paymentProvider,
    },
  });

  return NextResponse.json({ reservationCode: booking.reservationCode });
}
