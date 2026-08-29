import { createAdminClient } from "@/lib/supabase/admin";

export type ICalChannelFeed = {
  id: string;
  propertyId: string;
  channelName: string; // e.g., "Airbnb", "VRBO", "Booking.com", "Agoda", "Custom Website"
  icalUrl: string;
  lastSyncedAt?: string | null;
};

export type CalendarBlock = {
  id: string;
  propertyId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: "airbnb_sync" | "channel_sync" | "manual_block" | "guest_booking";
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
  const events: ICalEvent[] = [];
  const eventBlocks = icsContent.split("BEGIN:VEVENT");

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split("END:VEVENT")[0];

    const uidMatch = block.match(/UID:(.+)/i);
    const summaryMatch = block.match(/SUMMARY:(.+)/i);

    // Extract DTSTART & DTEND (Formats: YYYYMMDD, YYYYMMDDTHHMMSSZ, VALUE=DATE:YYYYMMDD)
    const dtStartMatch = block.match(/DTSTART(?:;VALUE=DATE)?:?(\d{8})/i);
    const dtEndMatch = block.match(/DTEND(?:;VALUE=DATE)?:?(\d{8})/i);

    if (dtStartMatch && dtEndMatch) {
      const rawStart = dtStartMatch[1];
      const rawEnd = dtEndMatch[1];

      const startDate = `${rawStart.slice(0, 4)}-${rawStart.slice(4, 6)}-${rawStart.slice(6, 8)}`;
      const endDate = `${rawEnd.slice(0, 4)}-${rawEnd.slice(4, 6)}-${rawEnd.slice(6, 8)}`;

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
 * Fetches calendar blocks stored for a property in Supabase property_rules metadata
 */
export async function getPropertyCalendarBlocks(propertyId: string): Promise<CalendarBlock[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const supabase = createAdminClient();

  const { data: rules } = await supabase
    .from("property_rules")
    .select("rule_text")
    .eq("property_id", propertyId)
    .eq("rule_key", "preset")
    .like("rule_text", "CALENDAR_BLOCKS|%")
    .is("deleted_at", null);

  if (rules && rules.length > 0) {
    const rawJson = rules[0].rule_text.replace("CALENDAR_BLOCKS|", "");
    try {
      return JSON.parse(rawJson);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Saves calendar blocks array for a property
 */
export async function savePropertyCalendarBlocks(propertyId: string, blocks: CalendarBlock[]): Promise<boolean> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  const supabase = createAdminClient();

  const { data: prop } = await supabase.from("properties").select("created_by").eq("id", propertyId).maybeSingle();
  const userId = prop?.created_by || null;

  // Delete existing calendar_blocks preset rule if present
  const { data: existing } = await supabase
    .from("property_rules")
    .select("id")
    .eq("property_id", propertyId)
    .eq("rule_key", "preset")
    .like("rule_text", "CALENDAR_BLOCKS|%");

  if (existing && existing.length > 0) {
    const ids = existing.map((r) => r.id);
    await supabase.from("property_rules").delete().in("id", ids);
  }

  const payload = {
    property_id: propertyId,
    rule_key: "preset",
    rule_text: "CALENDAR_BLOCKS|" + JSON.stringify(blocks),
    ...(userId ? { created_by: userId, updated_by: userId } : {}),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("property_rules").insert(payload as any);
  if (error) {
    console.error("savePropertyCalendarBlocks Error:", error);
  }
  return !error;
}

/**
 * Fetches stored multi-channel iCal feeds for a property
 */
export async function getICalChannelFeeds(propertyId: string): Promise<ICalChannelFeed[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const supabase = createAdminClient();

  const { data: rules } = await supabase
    .from("property_rules")
    .select("rule_text")
    .eq("property_id", propertyId)
    .eq("rule_key", "preset")
    .like("rule_text", "ICAL_FEEDS|%")
    .is("deleted_at", null);

  if (rules && rules.length > 0) {
    const rawJson = rules[0].rule_text.replace("ICAL_FEEDS|", "");
    try {
      return JSON.parse(rawJson);
    } catch {
      return [];
    }
  }

  // Fallback: check legacy single Airbnb URL
  const airbnbUrl = await getAirbnbICalUrl(propertyId);
  if (airbnbUrl) {
    return [
      {
        id: `feed_ab_${Date.now()}`,
        propertyId,
        channelName: "Airbnb",
        icalUrl: airbnbUrl,
        lastSyncedAt: new Date().toISOString(),
      },
    ];
  }

  return [];
}

/**
 * Saves multi-channel iCal feeds array for a property
 */
export async function saveICalChannelFeeds(propertyId: string, feeds: ICalChannelFeed[]): Promise<boolean> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  const supabase = createAdminClient();

  const { data: prop } = await supabase.from("properties").select("created_by").eq("id", propertyId).maybeSingle();
  const userId = prop?.created_by || null;

  const { data: existing } = await supabase
    .from("property_rules")
    .select("id")
    .eq("property_id", propertyId)
    .eq("rule_key", "preset")
    .like("rule_text", "ICAL_FEEDS|%");

  if (existing && existing.length > 0) {
    const ids = existing.map((r) => r.id);
    await supabase.from("property_rules").delete().in("id", ids);
  }

  const payload = {
    property_id: propertyId,
    rule_key: "preset",
    rule_text: "ICAL_FEEDS|" + JSON.stringify(feeds),
    ...(userId ? { created_by: userId, updated_by: userId } : {}),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("property_rules").insert(payload as any);
  return !error;
}

/**
 * Legacy getter for Airbnb iCal URL
 */
export async function getAirbnbICalUrl(propertyId: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const supabase = createAdminClient();

  const { data: rules } = await supabase
    .from("property_rules")
    .select("rule_text")
    .eq("property_id", propertyId)
    .eq("rule_key", "preset")
    .like("rule_text", "AIRBNB_ICAL_URL|%")
    .is("deleted_at", null);

  if (rules && rules.length > 0) {
    return rules[0].rule_text.replace("AIRBNB_ICAL_URL|", "");
  }

  return null;
}

/**
 * Legacy saver for Airbnb iCal URL
 */
export async function saveAirbnbICalUrl(propertyId: string, url: string): Promise<boolean> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  const supabase = createAdminClient();

  const { data: prop } = await supabase.from("properties").select("created_by").eq("id", propertyId).maybeSingle();
  const userId = prop?.created_by || null;

  const { data: existing } = await supabase
    .from("property_rules")
    .select("id")
    .eq("property_id", propertyId)
    .eq("rule_key", "preset")
    .like("rule_text", "AIRBNB_ICAL_URL|%");

  if (existing && existing.length > 0) {
    const ids = existing.map((r) => r.id);
    await supabase.from("property_rules").delete().in("id", ids);
  }

  const payload = {
    property_id: propertyId,
    rule_key: "preset",
    rule_text: "AIRBNB_ICAL_URL|" + url,
    ...(userId ? { created_by: userId, updated_by: userId } : {}),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("property_rules").insert(payload as any);
  return !error;
}

/**
 * Syncs all registered multi-channel iCal feeds for a property
 */
export async function syncAllICalFeeds(propertyId: string): Promise<{
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
    // Retain manual_block and guest_booking blocks
    const manualAndGuestBlocks = existingBlocks.filter(
      (b) => b.reason !== "airbnb_sync" && b.reason !== "channel_sync"
    );

    const newChannelBlocks: CalendarBlock[] = [];
    const updatedFeeds: ICalChannelFeed[] = [];
    const nowIso = new Date().toISOString();

    for (const feed of feeds) {
      try {
        const res = await fetch(feed.icalUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/calendar, text/plain, */*",
          },
          next: { revalidate: 0 },
        });

        if (res.ok) {
          const icsText = await res.text();
          const parsedEvents = parseICalFeed(icsText);

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

          updatedFeeds.push({ ...feed, lastSyncedAt: nowIso });
        } else {
          updatedFeeds.push(feed);
        }
      } catch {
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
      message: `Synced ${newChannelBlocks.length} reservation dates across ${updatedFeeds.length} channels!`,
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

  const res = await syncAllICalFeeds(propertyId);
  return {
    success: res.success,
    syncedEventsCount: res.totalSyncedEvents,
    message: res.message,
  };
}


