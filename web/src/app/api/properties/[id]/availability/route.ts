import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPropertyCalendarBlocks } from "@/features/properties/services/ical-sync.service";

export type PublicAvailabilityRange = {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    // 1. Strict Validation of Path Parameter (UUID or Slug)
    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, message: "Property not found" }, { status: 404 });
    }

    const trimmedId = id.trim();
    const isUuid = UUID_REGEX.test(trimmedId);
    const isSlug = SLUG_REGEX.test(trimmedId);

    // Reject malicious filter injection or invalid path values cleanly with 404
    if (!isUuid && !isSlug) {
      return NextResponse.json({ success: false, message: "Property not found" }, { status: 404 });
    }

    const supabase = createAdminClient();

    // 2. Fetch Real Active Status ID from property_status lookup table
    const { data: activeStatus, error: statusErr } = await supabase
      .from("property_status")
      .select("id")
      .eq("slug", "active")
      .maybeSingle();

    if (statusErr || !activeStatus) {
      console.error("[AVAILABILITY API] Failed to fetch active property_status:", statusErr);
      return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }

    // 3. Safe Scoped Parameterized Query (No raw string interpolation in .or())
    let query = supabase
      .from("properties")
      .select("id, status_id")
      .is("deleted_at", null);

    if (isUuid) {
      query = query.eq("id", trimmedId);
    } else {
      query = query.eq("slug", trimmedId);
    }

    const { data: property, error: propErr } = await query.maybeSingle();

    if (propErr) {
      console.error("[AVAILABILITY API] Database error fetching property:", propErr);
      return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }

    // 4. Require Real Active Status (Draft, Archived, Inactive, Deleted -> 404 without leaking state)
    if (!property || property.status_id !== activeStatus.id) {
      return NextResponse.json({ success: false, message: "Property not found" }, { status: 404 });
    }

    const blocks = await getPropertyCalendarBlocks(property.id);

    // 5. Sanitize Blocks Output: return ONLY date ranges, stripping all guest PII, notes, and pricing
    const sanitizedRanges: PublicAvailabilityRange[] = blocks.map((b) => ({
      startDate: (b.startDate || "").slice(0, 10),
      endDate: (b.endDate || "").slice(0, 10),
    }));

    return NextResponse.json(
      {
        success: true,
        propertyId: property.id,
        blockedRanges: sanitizedRanges,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: unknown) {
    // 6. Generic public 500 errors and server-side sanitized logging
    console.error("[AVAILABILITY API] Unexpected internal error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
