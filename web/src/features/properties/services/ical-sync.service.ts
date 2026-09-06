import { createAdminClient } from "@/lib/supabase/admin";
import { defaultChannelColor } from "@/lib/calendar-channel-colors";

export type ICalChannelFeed = {
  id: string;
  propertyId: string;
  channelName: string; // e.g., "Airbnb", "VRBO", "Booking.com", "Agoda", "Custom Website"
  icalUrl: string;
  lastSyncedAt?: string | null;
  color?: string | null;
};

export type CalendarBlock = {
  id: string;
  propertyId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: "airbnb_sync" | "channel_sync" | "manual_block" | "guest_booking" | string;
  channelName?: string | null; // e.g. "Airbnb", "VRBO", "Booking.com", "Agoda"
  notes?: string | null;
  createdAt?: string;
};

export type ICalEvent = {
  uid: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  summary: string;
};

/**
 * Parses RFC 5545 iCalendar (.ics) string format from Airbnb / OTAs
 */
export function parseICalFeed(icsContent: string): ICalEvent[] {
  if (!icsContent || typeof icsContent !== "string") return [];
  // Ensure the response is actually an iCalendar file, not an HTML error page
  if (!icsContent.includes("BEGIN:VCALENDAR") && !icsContent.includes("BEGIN:VEVENT")) return [];

  const events: ICalEvent[] = [];
  const eventBlocks = icsContent.split("BEGIN:VEVENT");

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split("END:VEVENT")[0];

    const uidMatch = block.match(/UID:(.+)/i);
    const summaryMatch = block.match(/SUMMARY:(.+)/i);

    // Extract DTSTART & DTEND robustly (handles VALUE=DATE, TZID=..., etc.)
    const dtStartMatch = block.match(/DTSTART[^:\r\n]*:(\d{4})(\d{2})(\d{2})/i);
    const dtEndMatch = block.match(/DTEND[^:\r\n]*:(\d{4})(\d{2})(\d{2})/i);

    if (dtStartMatch && dtEndMatch) {
      const startDate = `${dtStartMatch[1]}-${dtStartMatch[2]}-${dtStartMatch[3]}`;
      const endDate = `${dtEndMatch[1]}-${dtEndMatch[2]}-${dtEndMatch[3]}`;

      events.push({
        uid: uidMatch ? uidMatch[1].trim() : `evt_${Math.random().toString(36).substring(2, 9)}`,
        startDate,
        endDate,
        summary: summaryMatch ? summaryMatch[1].trim() : "Channel Reservation",
      });
    }
  }

  return events;
}

/**
 * Generates valid RFC 5545 iCalendar (.ics) string format for Everloft property calendar export
 */
export function generateICalFeed(propertyName: string, blocks: CalendarBlock[]): string {
  const nowStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Everloft Luxury Stays//Channel Manager 1.0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${propertyName} - Everloft Calendar`,
  ].join("\r\n");

  for (const block of blocks) {
    const startFormatted = block.startDate.replace(/-/g, "");
    const endFormatted = block.endDate.replace(/-/g, "");
    const summary = block.reason === "guest_booking" ? "Reserved - Everloft Direct Booking" : "Unavailable - Blocked";

    ics += "\r\n" + [
      "BEGIN:VEVENT",
      `UID:${block.id}@everloft.co.in`,
      `DTSTAMP:${nowStr}`,
      `DTSTART;VALUE=DATE:${startFormatted}`,
      `DTEND;VALUE=DATE:${endFormatted}`,
      `SUMMARY:${summary}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    ].join("\r\n");
  }

  ics += "\r\nEND:VCALENDAR\r\n";
  return ics;
}

/**
 * Fetches calendar blocks stored for a property in Supabase property_availability_blocks table.
 * Features non-blocking 15-minute background auto-sync for configured iCal feeds.
 */
export async function getPropertyCalendarBlocks(propertyId: string): Promise<CalendarBlock[]> {
  const supabase = createAdminClient();

  // Non-blocking background check for stale iCal feeds (>15 mins)
  (async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: feeds } = await (supabase as any)
        .from("property_integrations")
        .select("last_synced_at, listing_url")
        .eq("property_id", propertyId)
        .is("deleted_at", null);

      if (feeds && feeds.length > 0) {
        const nowMs = Date.now();
        const STALE_MS = 15 * 60 * 1000;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasStaleFeed = feeds.some((f: any) => {
          if (!f.listing_url || !f.listing_url.startsWith("http")) return false;
          if (!f.last_synced_at) return true;
          return nowMs - new Date(f.last_synced_at).getTime() > STALE_MS;
        });

        if (hasStaleFeed) {
          syncAllICalFeeds(propertyId).catch((e) => console.error("Background iCal sync error:", e));
        }
      }
    } catch {}
  })();

  // 1. Primary Source of Truth: Dedicated property_availability_blocks SQL table in Supabase
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tableBlocks } = await (supabase as any)
      .from("property_availability_blocks")
      .select("id, property_id, start_date, end_date, block_type, reason")
      .eq("property_id", propertyId)
      .is("deleted_at", null)
      .order("start_date", { ascending: true });

    if (tableBlocks && tableBlocks.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = tableBlocks.map((row: any) => {
        const isManual = row.block_type === "owner_use" || row.block_type === "maintenance" || row.block_type === "renovation";
        let channelName = null;
        if (!isManual && row.reason) {
          if (row.reason.toLowerCase().includes("airbnb")) channelName = "Airbnb";
          else if (row.reason.toLowerCase().includes("vrbo")) channelName = "VRBO";
          else if (row.reason.toLowerCase().includes("booking")) channelName = "Booking.com";
        }
        return {
          id: row.id,
          propertyId: row.property_id,
          startDate: (row.start_date || "").slice(0, 10),
          endDate: (row.end_date || "").slice(0, 10),
          reason: isManual ? "manual_block" : "channel_sync",
          channelName,
          notes: row.reason || "Blocked",
        } as CalendarBlock;
      });

      // Deduplicate mapped blocks to eliminate legacy duplicate database rows
      const uniqueMap = new Map<string, CalendarBlock>();
      for (const b of mapped) {
        const key = `${b.startDate}_${b.endDate}_${(b.channelName || b.reason || "").toLowerCase()}_${(b.notes || "").toLowerCase()}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, b);
        }
      }
      return Array.from(uniqueMap.values());
    }
  } catch (err) {
    console.error("getPropertyCalendarBlocks table query error:", err);
  }

  // 2. Secondary Fallback: Read from property_rules metadata JSON if relational table has no rows
  const { data: rules } = await supabase
    .from("property_rules")
    .select("rule_text")
    .eq("property_id", propertyId)
    .eq("rule_key", "preset")
    .like("rule_text", "CALENDAR_BLOCKS|%")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (rules && rules.length > 0) {
    const rawJson = rules[0].rule_text.replace("CALENDAR_BLOCKS|", "");
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const uniqueMap = new Map<string, CalendarBlock>();
        for (const b of parsed) {
          const key = `${b.startDate}_${b.endDate}_${(b.channelName || b.reason || "").toLowerCase()}_${(b.notes || "").toLowerCase()}`;
          if (!uniqueMap.has(key)) uniqueMap.set(key, b);
        }
        return Array.from(uniqueMap.values());
      }
    } catch {}
  }

  return [];
}

/**
 * Saves calendar blocks array for a property after deduplicating identical rows
 */
export async function savePropertyCalendarBlocks(propertyId: string, blocks: CalendarBlock[]): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: prop } = await supabase.from("properties").select("created_by").eq("id", propertyId).maybeSingle();
  const userId = prop?.created_by || null;

  // Deduplicate input blocks array
  const uniqueBlocksMap = new Map<string, CalendarBlock>();
  for (const b of blocks) {
    const key = `${b.startDate.slice(0, 10)}_${b.endDate.slice(0, 10)}_${(b.channelName || b.reason || "").toLowerCase()}_${(b.notes || "").toLowerCase()}`;
    if (!uniqueBlocksMap.has(key)) {
      uniqueBlocksMap.set(key, b);
    }
  }
  const dedupedBlocks = Array.from(uniqueBlocksMap.values());

  const ruleText = "CALENDAR_BLOCKS|" + JSON.stringify(dedupedBlocks);

  // 1. Sync to property_rules metadata JSON
  const { data: existing } = await supabase
    .from("property_rules")
    .select("id")
    .eq("property_id", propertyId)
    .eq("rule_key", "preset")
    .like("rule_text", "CALENDAR_BLOCKS|%")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  let isSaved = false;
  if (existing && existing.length > 0) {
    const primaryId = existing[0].id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await supabase
      .from("property_rules")
      .update({
        rule_text: ruleText,
        deleted_at: null,
        ...(userId ? { updated_by: userId } : {}),
      } as any)
      .eq("id", primaryId);

    if (existing.length > 1) {
      const extraIds = existing.slice(1).map((r) => r.id);
      await supabase.from("property_rules").delete().in("id", extraIds);
    }

    if (!updateErr) isSaved = true;
  } else {
    const payload = {
      property_id: propertyId,
      rule_key: "preset",
      rule_text: ruleText,
      ...(userId ? { created_by: userId, updated_by: userId } : {}),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("property_rules").insert(payload as any);
    if (!error) isSaved = true;
  }

  // 2. Sync to dedicated property_availability_blocks SQL table in Supabase
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingTableRows } = await (supabase as any)
      .from("property_availability_blocks")
      .select("id")
      .eq("property_id", propertyId)
      .is("deleted_at", null);

    if (existingTableRows && existingTableRows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const oldIds = existingTableRows.map((r: any) => r.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("property_availability_blocks").update({ deleted_at: new Date().toISOString() }).in("id", oldIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("property_availability_blocks").delete().in("id", oldIds);
    }

    if (dedupedBlocks.length > 0) {
      const tableRows = dedupedBlocks.map((b) => {
        let bType = "maintenance";
        if (b.reason === "manual_block") bType = "owner_use";
        else if (b.notes?.toLowerCase().includes("renovation")) bType = "renovation";
        else if (b.channelName || b.reason === "channel_sync" || b.reason === "airbnb_sync") bType = "other";

        return {
          property_id: propertyId,
          start_date: b.startDate.slice(0, 10),
          end_date: b.endDate.slice(0, 10),
          block_type: bType,
          reason: b.notes || b.channelName || b.reason,
          ...(userId ? { created_by: userId, updated_by: userId } : {}),
        };
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("property_availability_blocks").insert(tableRows);
    }
  } catch (err) {
    console.error("property_availability_blocks table sync error:", err);
  }

  return isSaved;
}

/**
 * Helper to map user-facing channel name to property_integrations ENUM
 */
export function channelToDbKey(channelName: string): string {
  const lower = (channelName || "").toLowerCase().trim();
  if (lower.includes("airbnb")) return "airbnb";
  if (lower.includes("booking")) return "booking_com";
  if (lower.includes("vrbo")) return "vrbo";
  if (lower.includes("agoda")) return "agoda";
  if (lower.includes("makemytrip")) return "makemytrip";
  if (lower.includes("goibibo")) return "goibibo";
  return "direct";
}

/**
 * Helper to map property_integrations ENUM key to human readable channel name
 */
export function dbKeyToChannelName(channelKey: string): string {
  switch (channelKey) {
    case "airbnb": return "Airbnb";
    case "booking_com": return "Booking.com";
    case "vrbo": return "VRBO";
    case "agoda": return "Agoda";
    case "makemytrip": return "MakeMyTrip";
    case "goibibo": return "Goibibo";
    default: return "Direct Website";
  }
}

/**
 * Fetches stored multi-channel iCal feeds for a property from property_integrations table in Supabase
 */
export async function getICalChannelFeeds(propertyId: string): Promise<ICalChannelFeed[]> {
  const supabase = createAdminClient();

  // 1. Primary Source of Truth: Relational property_integrations SQL table
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (supabase as any)
      .from("property_integrations")
      .select("id, property_id, channel, listing_url, status, sync_status, last_synced_at, calendar_color")
      .eq("property_id", propertyId)
      .is("deleted_at", null);

    if (rows && rows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validFeeds = rows.filter((r: any) => r.listing_url && r.listing_url.startsWith("http"));
      if (validFeeds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return validFeeds.map((r: any) => ({
          id: r.id,
          propertyId: r.property_id,
          channelName: dbKeyToChannelName(r.channel),
          icalUrl: r.listing_url,
          lastSyncedAt: r.last_synced_at ? new Date(r.last_synced_at).toISOString() : null,
          color: r.calendar_color || defaultChannelColor(r.channel),
        }));
      }
    }
  } catch (err) {
    console.error("getICalChannelFeeds property_integrations error:", err);
  }

  // 2. Secondary Fallback & Auto-Migration from legacy property_rules text metadata
  const { data: rules } = await supabase
    .from("property_rules")
    .select("rule_text")
    .eq("property_id", propertyId)
    .eq("rule_key", "preset")
    .like("rule_text", "ICAL_FEEDS|%")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (rules && rules.length > 0) {
    const rawJson = rules[0].rule_text.replace("ICAL_FEEDS|", "");
    try {
      const legacyFeeds: ICalChannelFeed[] = JSON.parse(rawJson);
      if (Array.isArray(legacyFeeds) && legacyFeeds.length > 0) {
        // Auto-migrate into property_integrations table for future fast queries
        await saveICalChannelFeeds(propertyId, legacyFeeds);
        return legacyFeeds;
      }
    } catch {}
  }

  // Legacy single Airbnb URL check
  const airbnbUrl = await getAirbnbICalUrl(propertyId);
  if (airbnbUrl) {
    const legacyFeed: ICalChannelFeed = {
      id: `feed_ab_${Date.now()}`,
      propertyId,
      channelName: "Airbnb",
      icalUrl: airbnbUrl,
      lastSyncedAt: new Date().toISOString(),
    };
    await saveICalChannelFeeds(propertyId, [legacyFeed]);
    return [legacyFeed];
  }

  return [];
}

/**
 * Saves multi-channel iCal feeds array for a property into property_integrations relational table
 */
export async function saveICalChannelFeeds(propertyId: string, feeds: ICalChannelFeed[]): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: prop } = await supabase.from("properties").select("created_by").eq("id", propertyId).maybeSingle();
  const userId = prop?.created_by || null;

  let isAllSaved = true;

  // 1. Primary Save: Upsert into property_integrations SQL table
  for (const feed of feeds) {
    const dbChannel = channelToDbKey(feed.channelName);
    const payload = {
      property_id: propertyId,
      channel: dbChannel,
      listing_url: feed.icalUrl,
      status: "active",
      sync_status: feed.lastSyncedAt ? "synced" : "never_synced",
      last_synced_at: feed.lastSyncedAt ? new Date(feed.lastSyncedAt).toISOString() : null,
      calendar_color: feed.color || defaultChannelColor(feed.channelName),
      updated_at: new Date().toISOString(),
      ...(userId ? { created_by: userId, updated_by: userId } : {}),
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("property_integrations")
        .upsert(payload, { onConflict: "property_id,channel" });
      if (error) {
        console.error("saveICalChannelFeeds upsert error:", error);
        isAllSaved = false;
      }
    } catch (err) {
      console.error("saveICalChannelFeeds error:", err);
      isAllSaved = false;
    }
  }

  // 2. Dual-Sync mirror to property_rules text metadata for backward compatibility
  const ruleText = "ICAL_FEEDS|" + JSON.stringify(feeds);
  const { data: existing } = await supabase
    .from("property_rules")
    .select("id")
    .eq("property_id", propertyId)
    .eq("rule_key", "preset")
    .like("rule_text", "ICAL_FEEDS|%")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (existing && existing.length > 0) {
    const primaryId = existing[0].id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("property_rules").update({ rule_text: ruleText, deleted_at: null } as any).eq("id", primaryId);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("property_rules").insert({ property_id: propertyId, rule_key: "preset", rule_text: ruleText } as any);
  }

  return isAllSaved;
}

/**
 * Legacy getter for Airbnb iCal URL from property_integrations table
 */
export async function getAirbnbICalUrl(propertyId: string): Promise<string | null> {
  const supabase = createAdminClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row } = await (supabase as any)
      .from("property_integrations")
      .select("listing_url")
      .eq("property_id", propertyId)
      .eq("channel", "airbnb")
      .is("deleted_at", null)
      .maybeSingle();

    if (row?.listing_url) return row.listing_url;
  } catch {}

  // Fallback to property_rules
  const { data: rules } = await supabase
    .from("property_rules")
    .select("rule_text")
    .eq("property_id", propertyId)
    .eq("rule_key", "preset")
    .like("rule_text", "AIRBNB_ICAL_URL|%")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (rules && rules.length > 0) {
    return rules[0].rule_text.replace("AIRBNB_ICAL_URL|", "");
  }

  return null;
}

/**
 * Legacy saver for Airbnb iCal URL
 */
export async function saveAirbnbICalUrl(propertyId: string, url: string): Promise<boolean> {
  return saveICalChannelFeeds(propertyId, [
    {
      id: `feed_ab_${Date.now()}`,
      propertyId,
      channelName: "Airbnb",
      icalUrl: url,
      lastSyncedAt: new Date().toISOString(),
    },
  ]);
}

/**
 * Syncs all registered multi-channel iCal feeds for a property
 * Features 15-minute smart caching to prevent unnecessary external HTTP rate limiting
 */
export async function syncAllICalFeeds(
  propertyId: string,
  forceSync = false
): Promise<{
  success: boolean;
  totalSyncedEvents: number;
  syncedFeedsCount: number;
  message: string;
}> {
  try {
    const feeds = await getICalChannelFeeds(propertyId);
    if (feeds.length === 0) {
      return { success: true, totalSyncedEvents: 0, syncedFeedsCount: 0, message: "No external calendar feeds configured." };
    }

    const existingBlocks = await getPropertyCalendarBlocks(propertyId);
    const manualAndGuestBlocks = existingBlocks.filter(
      (b) => b.reason !== "airbnb_sync" && b.reason !== "channel_sync"
    );

    const existingChannelBlocks = existingBlocks.filter(
      (b) => b.reason === "airbnb_sync" || b.reason === "channel_sync"
    );

    const newChannelBlocks: CalendarBlock[] = [];
    const updatedFeeds: ICalChannelFeed[] = [];
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    // 15-minute smart cache cooldown (900,000 ms) unless forceSync is explicitly requested
    const SYNC_COOLDOWN_MS = 15 * 60 * 1000;
    let feedsAttempted = 0;

    for (const feed of feeds) {
      const lastSyncedMs = feed.lastSyncedAt ? new Date(feed.lastSyncedAt).getTime() : 0;
      const isWithinCooldown = !forceSync && lastSyncedMs > 0 && nowMs - lastSyncedMs < SYNC_COOLDOWN_MS;

      if (isWithinCooldown) {
        // Skip external HTTP request, serve cached dates from property_availability_blocks DB
        updatedFeeds.push(feed);
        const retainedForFeed = existingChannelBlocks.filter(
          (b) => b.channelName?.toLowerCase() === feed.channelName.toLowerCase() || b.id.includes(feed.id)
        );
        newChannelBlocks.push(...retainedForFeed);
        continue;
      }

      feedsAttempted++;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(feed.icalUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Accept": "text/calendar, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "max-age=900",
          },
          signal: controller.signal,
          next: { revalidate: 900 },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const icsText = await res.text();
          const parsedEvents = parseICalFeed(icsText);

          if (parsedEvents.length > 0) {
            parsedEvents.forEach((evt) => {
              newChannelBlocks.push({
                id: `ch_${feed.id}_${evt.uid.replace(/[^a-zA-Z0-9]/g, "")}`,
                propertyId,
                startDate: evt.startDate,
                endDate: evt.endDate,
                reason: "channel_sync",
                channelName: feed.channelName,
                notes: `${feed.channelName}: ${evt.summary || "Reservation"}`,
              });
            });
          } else {
            // Retain previous blocks if 0 events returned (e.g. rate limit or empty response)
            const retainedForFeed = existingChannelBlocks.filter(
              (b) => b.channelName?.toLowerCase() === feed.channelName.toLowerCase()
            );
            newChannelBlocks.push(...retainedForFeed);
          }

          updatedFeeds.push({ ...feed, lastSyncedAt: nowIso });
        } else {
          // HTTP error -> retain existing blocks to prevent losing reservations
          const retainedForFeed = existingChannelBlocks.filter(
            (b) => b.channelName?.toLowerCase() === feed.channelName.toLowerCase()
          );
          newChannelBlocks.push(...retainedForFeed);
          updatedFeeds.push(feed);
        }
      } catch {
        // Timeout or network error -> retain existing blocks
        const retainedForFeed = existingChannelBlocks.filter(
          (b) => b.channelName?.toLowerCase() === feed.channelName.toLowerCase()
        );
        newChannelBlocks.push(...retainedForFeed);
        updatedFeeds.push(feed);
      }
    }

    const combinedBlocks = [...manualAndGuestBlocks, ...newChannelBlocks];
    await savePropertyCalendarBlocks(propertyId, combinedBlocks);
    await saveICalChannelFeeds(propertyId, updatedFeeds);

    return {
      success: true,
      totalSyncedEvents: newChannelBlocks.length,
      syncedFeedsCount: updatedFeeds.length,
      message: `Synced ${newChannelBlocks.length} reservation dates across ${updatedFeeds.length} channels (${feedsAttempted} freshly checked)!`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error during multi-channel iCal sync";
    return { success: false, totalSyncedEvents: 0, syncedFeedsCount: 0, message: msg };
  }
}

/**
 * Legacy single Airbnb iCal feed sync wrapper
 */
export async function syncAirbnbICalFeed(
  propertyId: string,
  icalUrl: string
): Promise<{ success: boolean; syncedEventsCount: number; message: string }> {
  await saveAirbnbICalUrl(propertyId, icalUrl);
  const feeds = await getICalChannelFeeds(propertyId);
  const existingAirbnbFeed = feeds.find((f) => f.channelName === "Airbnb");

  if (!existingAirbnbFeed) {
    feeds.push({
      id: `feed_ab_${Date.now()}`,
      propertyId,
      channelName: "Airbnb",
      icalUrl,
      lastSyncedAt: new Date().toISOString(),
    });
    await saveICalChannelFeeds(propertyId, feeds);
  }

  const res = await syncAllICalFeeds(propertyId, true);
  return {
    success: res.success,
    syncedEventsCount: res.totalSyncedEvents,
    message: res.message,
  };
}

