import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateReservationCode, nightsBetween } from "@/lib/format";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { verifyCaptchaToken } from "@/lib/security/captcha";

const DEMO_COUPONS: Record<string, number> = {
  EVERLOFT10: 0.1,
  WELCOME5: 0.05,
};

export function isPublicBookingEnabled(): boolean {
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  if (isProd) {
    return process.env.ENABLE_PUBLIC_BOOKING === "true";
  }
  return process.env.ENABLE_PUBLIC_BOOKING !== "false";
}

const bookingSchema = z.object({
  propertySlug: z.string().trim().min(1).max(100),
  checkIn: z.string().trim(),
  checkOut: z.string().trim(),
  guests: z.number().int().min(1).max(50),
  guestName: z.string().trim().min(2).max(100),
  guestEmail: z.string().trim().email().max(150),
  guestPhone: z.string().trim().min(6).max(25),
  specialRequests: z.string().trim().max(1000).optional(),
  couponCode: z.string().trim().max(30).optional(),
  captchaToken: z.string().optional(),
});

export async function POST(request: Request) {
  // 1. Check Feature Flag: Enable Public Booking
  if (!isPublicBookingEnabled()) {
    return NextResponse.json(
      { error: "Public online booking creation is currently disabled. Please contact us or submit an inquiry." },
      { status: 403 }
    );
  }

  // 2. Rate Limiting (Max 5 booking creation attempts per minute per IP)
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit("booking_create", clientIp, { windowMs: 60_000, maxRequests: 5 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many booking requests. Please wait a minute before trying again." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) },
      }
    );
  }

  // 3. Parse Input & Validate Schema
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const data = parsed.data;

  // 4. CAPTCHA Verification
  const isCaptchaValid = await verifyCaptchaToken(data.captchaToken, {
    action: "booking_request",
    request,
  });
  if (!isCaptchaValid) {
    return NextResponse.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 400 });
  }

  // 5. Fetch Property & Check Guest Limits
  const property = await prisma.property.findUnique({ where: { slug: data.propertySlug } });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  if (data.guests > property.guests) {
    return NextResponse.json(
      { error: `Guest count exceeds maximum allowed capacity (${property.guests} guests)` },
      { status: 400 }
    );
  }

  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    return NextResponse.json({ error: "Invalid check-in or check-out dates" }, { status: 400 });
  }

  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) {
    return NextResponse.json({ error: "Minimum stay is 1 night" }, { status: 400 });
  }

  const subtotal = nights * property.pricePerNight;
  const serviceFee = Math.round(subtotal * property.serviceFeePct);
  const couponKey = data.couponCode?.toUpperCase().trim();
  const discountPct = couponKey ? DEMO_COUPONS[couponKey] ?? 0 : 0;
  const discount = Math.round(subtotal * discountPct);
  const total = subtotal + property.cleaningFee + serviceFee - discount;

  // 6. Booking Creation: Requests are ALWAYS PENDING and UNPAID
  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Check for overlapping confirmed or pending bookings
      const existingOverlaps = await tx.booking.findFirst({
        where: {
          propertyId: property.id,
          status: { in: ["CONFIRMED", "PENDING"] },
          AND: [
            { checkIn: { lt: checkOut } },
            { checkOut: { gt: checkIn } },
          ],
        },
      });

      if (existingOverlaps) {
        throw new Error("DATES_UNAVAILABLE");
      }

      const normalizedEmail = data.guestEmail.toLowerCase().trim();

      return await tx.booking.create({
        data: {
          reservationCode: generateReservationCode(),
          propertyId: property.id,
          checkIn,
          checkOut,
          nights,
          guests: data.guests,
          guestName: data.guestName.trim(),
          guestEmail: normalizedEmail,
          guestPhone: data.guestPhone.trim(),
          specialRequests: data.specialRequests,
          subtotal,
          cleaningFee: property.cleaningFee,
          serviceFee,
          taxes: 0,
          couponCode: discountPct > 0 ? couponKey : undefined,
          discount,
          total,
          currency: property.currency,
          status: "PENDING",
          paymentStatus: "UNPAID",
        },
      });
    });

    return NextResponse.json({
      reservationCode: booking.reservationCode,
      total: booking.total,
      currency: booking.currency,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "DATES_UNAVAILABLE") {
      return NextResponse.json(
        { error: "Selected dates are no longer available for this property." },
        { status: 409 }
      );
    }
    console.error("Booking creation error");
    return NextResponse.json({ error: "Failed to process booking request" }, { status: 500 });
  }
}
