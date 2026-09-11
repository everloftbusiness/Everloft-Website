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

export function getLocalTimezoneCode(): string {
  try {
    if (typeof window === "undefined") return "UTC";
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
    }).formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    if (tzPart && tzPart.value) return tzPart.value;
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
  } catch {
    return "Local";
  }
}

export function formatLocalDateTime(
  dateInput: Date | string | number | null | undefined,
  opts: { includeTime?: boolean; includeTimezone?: boolean } = { includeTime: true, includeTimezone: true }
): string {
  if (!dateInput) return "—";
  try {
    const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
    if (Number.isNaN(date.getTime())) return String(dateInput);

    const includeTime = opts.includeTime ?? true;
    const includeTimezone = opts.includeTimezone ?? true;

    if (!includeTime) {
      return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    }

    const formatted = new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);

    if (includeTimezone) {
      const tz = getLocalTimezoneCode();
      return `${formatted} (${tz})`;
    }
    return formatted;
  } catch {
    return String(dateInput);
  }
}

export function formatTimeAgo(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return "—";
  try {
    const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 5000) return "Just now";
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return String(dateInput);
  }
}

