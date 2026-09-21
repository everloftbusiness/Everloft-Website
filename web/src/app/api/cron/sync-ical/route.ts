/**
 * Protected iCal Feed Sync Cron Endpoint
 *
 * Execution Security & Fail-Closed Controls:
 * 1. Requires mandatory `ENABLE_ICAL_CRON=true` server-only opt-in.
 * 2. Requires mandatory `CRON_SECRET` environment variable checked via `crypto.timingSafeEqual`.
 * 3. Automatically blocks execution in Vercel Preview environments (`isBackgroundJobAllowed`).
 * 4. Uses AbortController per-fetch timeouts and best-effort between-item cutoff for 15-second execution budget.
 *
 * Note on Scheduling & Hobby Limitations:
 * - Vercel Hobby accounts do not support 2-hour or 6-hour cron schedules in vercel.json.
 * - This route remains dormant until ENABLE_ICAL_CRON=true is configured and a schedule is set in Vercel.
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isBackgroundJobAllowed } from "@/lib/env-guard";
import { syncAllICalFeeds } from "@/features/properties/services/ical-sync.service";

const MAX_PROPERTIES_PER_RUN = 10;
const ROUTE_TIME_BUDGET_MS = 15000;

export async function GET(request: Request) {
  const startTime = Date.now();

  // 1. Check Server-Only Opt-in Flag (ENABLE_ICAL_CRON=true)
  if (process.env.ENABLE_ICAL_CRON !== "true") {
    return NextResponse.json(
      {
        success: true,
        message: "Cron execution skipped: ENABLE_ICAL_CRON server configuration is not true.",
      },
      { status: 200 }
    );
  }

  // 2. Mandatory CRON_SECRET & Fail-Closed Authentication
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.trim() === "") {
    console.error("[CRON ERROR] CRON_SECRET is missing or empty.");
    return NextResponse.json(
      { success: false, message: "Unauthorized: Server CRON_SECRET configuration is missing." },
      { status: 401 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "Unauthorized: Missing or malformed Authorization header." },
      { status: 401 }
    );
  }

  const expectedHeader = `Bearer ${cronSecret}`;
  if (authHeader.length !== expectedHeader.length) {
    return NextResponse.json(
      { success: false, message: "Unauthorized: Invalid cron secret token." },
      { status: 401 }
    );
  }

  const headerBuf = Buffer.from(authHeader);
  const expectedBuf = Buffer.from(expectedHeader);
  if (!crypto.timingSafeEqual(headerBuf, expectedBuf)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized: Invalid cron secret token." },
      { status: 401 }
    );
  }

  // 3. Environment Guard (blocks execution in Preview environments)
  if (!isBackgroundJobAllowed("Cron iCal Feed Sync")) {
    return NextResponse.json({
      success: true,
      message: "Cron execution skipped: Execution in Vercel Preview or disabled environment.",
    });
  }

  try {
    const supabase = createAdminClient();

    // 4. Query Active Status ID via property_status relationship
    const { data: activeStatus, error: statusError } = await supabase
      .from("property_status")
      .select("id")
      .eq("slug", "active")
      .maybeSingle();

    if (statusError || !activeStatus) {
      console.error("[CRON ERROR] Failed to retrieve active property_status ID:", statusError);
      return NextResponse.json(
        { success: false, message: "Database query error: Active property status not configured." },
        { status: 500 }
      );
    }

    // 5. Fetch Active Properties (Bounded Execution limit)
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, name")
      .eq("status_id", activeStatus.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(MAX_PROPERTIES_PER_RUN);

    if (propertiesError) {
      console.error("[CRON ERROR] Failed to fetch active properties:", propertiesError);
      return NextResponse.json(
        { success: false, message: "Database query error while retrieving properties." },
        { status: 500 }
      );
    }

    if (!properties || properties.length === 0) {
      return NextResponse.json({ success: true, message: "No active properties to sync." });
    }

    let totalSyncedEvents = 0;
    let totalSyncedFeeds = 0;
    let processedCount = 0;

    const routeTimeoutController = new AbortController();
    const timeoutId = setTimeout(() => routeTimeoutController.abort(), ROUTE_TIME_BUDGET_MS);

    // 6. Bounded Sync Loop with Best-Effort Cutoff and Per-Item AbortSignal
    try {
      for (const prop of properties) {
        if (Date.now() - startTime > ROUTE_TIME_BUDGET_MS || routeTimeoutController.signal.aborted) {
          console.warn(`[CRON WARN] Execution time budget (${ROUTE_TIME_BUDGET_MS}ms) reached. Stopping batch early.`);
          break;
        }

        const res = await syncAllICalFeeds(prop.id, false, routeTimeoutController.signal);
        if (res.success) {
          totalSyncedEvents += res.totalSyncedEvents;
          totalSyncedFeeds += res.syncedFeedsCount;
        }
        processedCount++;
      }
    } finally {
      clearTimeout(timeoutId);
    }

    return NextResponse.json({
      success: true,
      propertiesProcessed: processedCount,
      totalSyncedFeeds,
      totalSyncedEvents,
      message: `Successfully processed ${processedCount} property(ies) (synced ${totalSyncedFeeds} feed(s)).`,
    });
  } catch (error: unknown) {
    console.error("[CRON ERROR] iCal sync route execution failed:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
