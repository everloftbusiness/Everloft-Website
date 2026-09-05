"use server";

import { revalidatePath } from "next/cache";
import {
  getPropertyCalendarBlocks,
  savePropertyCalendarBlocks,
  getICalChannelFeeds,
  saveICalChannelFeeds,
  syncAllICalFeeds,
  getAirbnbICalUrl,
  saveAirbnbICalUrl,
  syncAirbnbICalFeed,
  type CalendarBlock,
  type ICalChannelFeed,
} from "@/features/properties/services/ical-sync.service";

export async function fetchCalendarDataAction(propertyId: string) {
  const [blocks, feeds, airbnbUrl] = await Promise.all([
    getPropertyCalendarBlocks(propertyId),
    getICalChannelFeeds(propertyId),
    getAirbnbICalUrl(propertyId),
  ]);
  return { blocks, feeds, airbnbUrl };
}

export async function addICalFeedAction(propertyId: string, channelName: string, icalUrl: string) {
  if (!icalUrl || !icalUrl.startsWith("http")) {
    return { success: false, message: "Please provide a valid iCal URL starting with http:// or https://" };
  }

  const feeds = await getICalChannelFeeds(propertyId);
  const newFeed: ICalChannelFeed = {
    id: `feed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    propertyId,
    channelName: channelName || "Custom Channel",
    icalUrl,
    lastSyncedAt: null,
  };

  const updatedFeeds = [...feeds, newFeed];
  const ok = await saveICalChannelFeeds(propertyId, updatedFeeds);

  if (ok) {
    if (channelName.toLowerCase() === "airbnb") {
      await saveAirbnbICalUrl(propertyId, icalUrl);
    }
    // Auto-sync immediately
    const syncRes = await syncAllICalFeeds(propertyId);
    try {
      revalidatePath("/dashboard/properties", "layout");
      revalidatePath("/properties", "layout");
    } catch {}
    return {
      success: true,
      message: `Added feed for ${channelName}. ${syncRes.message}`,
    };
  }

  return { success: false, message: "Failed to save calendar feed." };
}

export async function deleteICalFeedAction(propertyId: string, feedId: string) {
  const feeds = await getICalChannelFeeds(propertyId);
  const targetFeed = feeds.find((f) => f.id === feedId);
  if (targetFeed) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const { channelToDbKey } = await import("@/features/properties/services/ical-sync.service");
      const supabase = createAdminClient();
      const dbChannel = channelToDbKey(targetFeed.channelName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("property_integrations")
        .update({ deleted_at: new Date().toISOString() })
        .eq("property_id", propertyId)
        .eq("channel", dbChannel);
    } catch (e) {
      console.error("deleteICalFeedAction property_integrations error:", e);
    }
  }

  const updatedFeeds = feeds.filter((f) => f.id !== feedId);
  const ok = await saveICalChannelFeeds(propertyId, updatedFeeds);

  if (ok) {
    // Re-sync remaining feeds
    await syncAllICalFeeds(propertyId, true);
    try {
      revalidatePath("/dashboard/properties", "layout");
      revalidatePath("/properties", "layout");
    } catch {}
    return { success: true, message: "Calendar feed removed." };
  }

  return { success: false, message: "Failed to remove calendar feed." };
}

export async function syncAllICalFeedsAction(propertyId: string, forceSync = true) {
  const result = await syncAllICalFeeds(propertyId, forceSync);
  if (result.success) {
    try {
      revalidatePath("/dashboard/properties", "layout");
      revalidatePath("/properties", "layout");
    } catch {}
  }
  return result;
}

export async function syncAirbnbICalAction(propertyId: string, icalUrl: string) {
  if (!icalUrl || !icalUrl.startsWith("http")) {
    return { success: false, message: "Please provide a valid iCal URL starting with http:// or https://" };
  }

  const result = await syncAirbnbICalFeed(propertyId, icalUrl);
  if (result.success) {
    try {
      revalidatePath("/dashboard/properties", "layout");
      revalidatePath("/properties", "layout");
    } catch {}
  }
  return result;
}

export async function saveManualCalendarBlockAction(
  propertyId: string,
  startDate: string,
  endDate: string,
  notes?: string
) {
  if (!startDate || !endDate) {
    return { success: false, message: "Start date and End date are required.", blocks: [] };
  }

  if (startDate > endDate) {
    return { success: false, message: "End date must be on or after Start date.", blocks: [] };
  }

  const existingBlocks = await getPropertyCalendarBlocks(propertyId);
  const newBlock: CalendarBlock = {
    id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    propertyId,
    startDate: startDate.slice(0, 10),
    endDate: endDate.slice(0, 10),
    reason: "manual_block",
    notes: notes || "Manual Block / Maintenance",
  };

  const updatedBlocks = [...existingBlocks, newBlock];
  const ok = await savePropertyCalendarBlocks(propertyId, updatedBlocks);

  if (ok) {
    try {
      revalidatePath("/dashboard/properties", "layout");
      revalidatePath("/properties", "layout");
    } catch {}
    return { success: true, message: "Calendar block added successfully!", blocks: updatedBlocks };
  }

  return { success: false, message: "Failed to save calendar block.", blocks: existingBlocks };
}

export async function deleteCalendarBlockAction(propertyId: string, blockId: string) {
  const existingBlocks = await getPropertyCalendarBlocks(propertyId);
  const updatedBlocks = existingBlocks.filter((b) => b.id !== blockId);
  const ok = await savePropertyCalendarBlocks(propertyId, updatedBlocks);

  if (ok) {
    try {
      revalidatePath("/dashboard/properties", "layout");
      revalidatePath("/properties", "layout");
    } catch {}
    return { success: true, message: "Calendar block removed.", blocks: updatedBlocks };
  }

  return { success: false, message: "Failed to delete calendar block.", blocks: existingBlocks };
}

