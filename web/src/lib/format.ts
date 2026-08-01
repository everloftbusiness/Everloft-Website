export function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateShort(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateRange(checkIn: Date | string, checkOut: Date | string) {
  const inD = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const outD = typeof checkOut === "string" ? new Date(checkOut) : checkOut;
  const sameMonth = inD.getMonth() === outD.getMonth() && inD.getFullYear() === outD.getFullYear();
  const inFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: sameMonth ? undefined : "short" }).format(inD);
  const outFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(outD);
  return `${inFmt} – ${outFmt}`;
}

export function nightsBetween(checkIn: Date | string, checkOut: Date | string) {
  const inD = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const outD = typeof checkOut === "string" ? new Date(checkOut) : checkOut;
  const ms = outD.getTime() - inD.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function generateReservationCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "EVL-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
