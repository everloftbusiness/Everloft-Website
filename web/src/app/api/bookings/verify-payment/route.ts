import { NextResponse } from "next/server";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const verifySchema = z.object({
  reservationCode: z.string().trim().min(5).max(50),
  razorpayOrderId: z.string().trim().min(5).max(100),
  razorpayPaymentId: z.string().trim().min(5).max(100),
  razorpaySignature: z.string().trim().min(5).max(256),
});

export async function POST(request: Request) {
  // 1. Rate Limiting
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit("payment_verify", clientIp, { windowMs: 60_000, maxRequests: 10 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please wait a minute." },
      { status: 429 }
    );
  }

  // 2. Parse payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment verification data" }, { status: 400 });
  }

  const { reservationCode, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  // 3. Retrieve booking
  const booking = await prisma.booking.findUnique({
    where: { reservationCode },
  });

  if (!booking) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  // 4. Idempotency protection: If already paid, return clean success without re-processing
  if (booking.paymentStatus === "PAID" && booking.status === "CONFIRMED") {
    return NextResponse.json({
      ok: true,
      reservationCode: booking.reservationCode,
      message: "Payment already verified",
    });
  }

  // 5. Razorpay Secret Key check
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!razorpaySecret && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Payment verification unavailable: RAZORPAY_KEY_SECRET is not configured." },
      { status: 500 }
    );
  }

  // Constant-time HMAC SHA256 signature verification
  let isSignatureValid = false;
  if (razorpaySecret) {
    const expectedSignature = createHmac("sha256", razorpaySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    const actualBuffer = Buffer.from(razorpaySignature, "utf-8");

    if (expectedBuffer.length === actualBuffer.length) {
      isSignatureValid = timingSafeEqual(expectedBuffer, actualBuffer);
    }
  } else if (process.env.NODE_ENV === "test") {
    // Test mode fallback
    isSignatureValid = true;
  }

  if (!isSignatureValid) {
    return NextResponse.json({ error: "Invalid payment signature verification failed." }, { status: 400 });
  }

  // 6. Update booking status atomically
  const updatedBooking = await prisma.booking.update({
    where: { reservationCode },
    data: {
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paymentProvider: "razorpay",
    },
  });

  return NextResponse.json({
    ok: true,
    reservationCode: updatedBooking.reservationCode,
    status: updatedBooking.status,
    paymentStatus: updatedBooking.paymentStatus,
  });
}
