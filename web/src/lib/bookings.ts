import { prisma } from "@/lib/prisma";

export async function getBookingByCode(code: string) {
  return prisma.booking.findUnique({
    where: { reservationCode: code },
    include: { property: true },
  });
}

export function buildIcsFile({
  reservationCode,
  propertyName,
  address,
  checkIn,
  checkOut,
}: {
  reservationCode: string;
  propertyName: string;
  address: string;
  checkIn: Date;
  checkOut: Date;
}) {
  const toIcsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Everloft//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${reservationCode}@everloft.co.in`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(checkIn)}`,
    `DTEND:${toIcsDate(checkOut)}`,
    `SUMMARY:Everloft Stay — ${propertyName}`,
    `LOCATION:${address}`,
    `DESCRIPTION:Reservation ${reservationCode} with Everloft.`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
