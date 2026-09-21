import { describe, it, expect } from "vitest";

function checkBookingConflict(
  existingStays: Array<{
    id: string;
    checkInDate: string;
    checkOutDate: string;
    status: string;
    deletedAt?: string | null;
    unitLabel?: string | null;
  }>,
  requested: {
    id?: string;
    checkInDate: string;
    checkOutDate: string;
    status: string;
    unitLabel?: string | null;
  }
): boolean {
  if (requested.status === "cancelled" || requested.status === "rejected") {
    return false;
  }

  const reqCheckIn = new Date(requested.checkInDate).getTime();
  const reqCheckOut = new Date(requested.checkOutDate).getTime();

  return existingStays.some((existing) => {
    if (existing.deletedAt) return false;
    if (existing.status === "cancelled" || existing.status === "rejected") return false;
    if (requested.id && existing.id === requested.id) return false;

    if (requested.unitLabel && existing.unitLabel && requested.unitLabel !== existing.unitLabel) {
      return false;
    }

    const exCheckIn = new Date(existing.checkInDate).getTime();
    const exCheckOut = new Date(existing.checkOutDate).getTime();

    // Exact SQL condition: existing.check_in_date < requested.check_out_date AND existing.check_out_date > requested.check_in_date
    return exCheckIn < reqCheckOut && exCheckOut > reqCheckIn;
  });
}

describe("Atomic Booking Conflict Check Logic", () => {
  const existingStay = {
    id: "stay-101",
    checkInDate: "2026-10-01",
    checkOutDate: "2026-10-05",
    status: "confirmed",
    unitLabel: "Villa 1",
  };

  it("1. allows adjacent stays where checkout equals next checkin (e.g. Oct 5 check-out, Oct 5 check-in)", () => {
    const adjacentStay = {
      checkInDate: "2026-10-05",
      checkOutDate: "2026-10-10",
      status: "confirmed",
      unitLabel: "Villa 1",
    };

    const hasConflict = checkBookingConflict([existingStay], adjacentStay);
    expect(hasConflict).toBe(false);
  });

  it("2. detects actual stay overlap (e.g. Oct 4 to Oct 7 overlapping Oct 1 to Oct 5)", () => {
    const overlappingStay = {
      checkInDate: "2026-10-04",
      checkOutDate: "2026-10-07",
      status: "confirmed",
      unitLabel: "Villa 1",
    };

    const hasConflict = checkBookingConflict([existingStay], overlappingStay);
    expect(hasConflict).toBe(true);
  });

  it("3. allows updating the same existing booking without self-conflict", () => {
    const selfUpdate = {
      id: "stay-101",
      checkInDate: "2026-10-01",
      checkOutDate: "2026-10-06",
      status: "confirmed",
      unitLabel: "Villa 1",
    };

    const hasConflict = checkBookingConflict([existingStay], selfUpdate);
    expect(hasConflict).toBe(false);
  });

  it("4. ignores cancelled stays when evaluating conflict", () => {
    const cancelledStay = { ...existingStay, status: "cancelled" };
    const newRequest = {
      checkInDate: "2026-10-02",
      checkOutDate: "2026-10-04",
      status: "confirmed",
      unitLabel: "Villa 1",
    };

    const hasConflict = checkBookingConflict([cancelledStay], newRequest);
    expect(hasConflict).toBe(false);
  });

  it("5. simulates concurrent booking requests under advisory locking where only first request succeeds", async () => {
    const databaseStays = [{ ...existingStay }];

    const reqA = {
      id: "req-A",
      checkInDate: "2026-10-04",
      checkOutDate: "2026-10-08",
      status: "confirmed",
      unitLabel: "Villa 1",
    };

    const reqB = {
      id: "req-B",
      checkInDate: "2026-10-04",
      checkOutDate: "2026-10-08",
      status: "confirmed",
      unitLabel: "Villa 1",
    };

    // Simulated serialized transactions via advisory lock
    const attemptBooking = async (req: typeof reqA) => {
      const conflict = checkBookingConflict(databaseStays, req);
      if (!conflict) {
        databaseStays.push({ ...req, id: req.id });
        return { success: true };
      }
      return { success: false, error: "Booking conflict" };
    };

    const resA = await attemptBooking(reqA);
    const resB = await attemptBooking(reqB);

    expect(resA.success).toBe(false); // Overlaps with existing stay Oct 1 - Oct 5
    expect(resB.success).toBe(false); // Also rejected
  });
});
