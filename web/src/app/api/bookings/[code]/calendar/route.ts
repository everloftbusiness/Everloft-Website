import { NextResponse } from "next/server";
import { getBookingByCode, buildIcsFile } from "@/lib/bookings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const booking = await getBookingByCode(code);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const ics = buildIcsFile({
    reservationCode: booking.reservationCode,
    propertyName: booking.property.name,
    address: booking.property.address,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="everloft-${booking.reservationCode}.ics"`,
    },
  });
}
