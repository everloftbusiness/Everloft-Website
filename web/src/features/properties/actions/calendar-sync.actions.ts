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
    revalidatePath(`/dashboard/properties`);
    revalidatePath(`/properties`);
    return {
      success: true,
      message: `Added feed for ${channelName}. ${syncRes.message}`,
    };
  }

  return { success: false, message: "Failed to save calendar feed." };
}

export async function deleteICalFeedAction(propertyId: string, feedId: string) {
  const feeds = await getICalChannelFeeds(propertyId);
  const updatedFeeds = feeds.filter((f) => f.id !== feedId);
  const ok = await saveICalChannelFeeds(propertyId, updatedFeeds);

  if (ok) {
    // Re-sync remaining feeds
    await syncAllICalFeeds(propertyId);
    revalidatePath(`/dashboard/properties`);
    revalidatePath(`/properties`);
    return { success: true, message: "Calendar feed removed." };
  }

  return { success: false, message: "Failed to remove calendar feed." };
}

export async function syncAllICalFeedsAction(propertyId: string) {
  const result = await syncAllICalFeeds(propertyId);
  if (result.success) {
    revalidatePath(`/dashboard/properties`);
    revalidatePath(`/properties`);
  }
  return result;
}

export async function syncAirbnbICalAction(propertyId: string, icalUrl: string) {
  if (!icalUrl || !icalUrl.startsWith("http")) {
    return { success: false, message: "Please provide a valid iCal URL starting with http:// or https://" };
  }

  const result = await syncAirbnbICalFeed(propertyId, icalUrl);
  if (result.success) {
    revalidatePath(`/dashboard/properties`);
    revalidatePath(`/properties`);
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
    return { success: false, message: "Start date and End date are required." };
  }

  if (startDate > endDate) {
    return { success: false, message: "End date must be on or after Start date." };
  }

  const existingBlocks = await getPropertyCalendarBlocks(propertyId);
  const newBlock: CalendarBlock = {
    id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    propertyId,
    startDate,
    endDate,
    reason: "manual_block",
    notes: notes || "Manual Block / Maintenance",
  };

  const updatedBlocks = [...existingBlocks, newBlock];
  const ok = await savePropertyCalendarBlocks(propertyId, updatedBlocks);

  if (ok) {
    revalidatePath(`/dashboard/properties`);
    revalidatePath(`/properties`);
    return { success: true, message: "Calendar block added successfully!" };
  }

  return { success: false, message: "Failed to save calendar block." };
}

export async function deleteCalendarBlockAction(propertyId: string, blockId: string) {
  const existingBlocks = await getPropertyCalendarBlocks(propertyId);
  const updatedBlocks = existingBlocks.filter((b) => b.id !== blockId);
  const ok = await savePropertyCalendarBlocks(propertyId, updatedBlocks);

  if (ok) {
    revalidatePath(`/dashboard/properties`);
    revalidatePath(`/properties`);
    return { success: true, message: "Calendar block removed." };
  }

  return { success: false, message: "Failed to delete calendar block." };
}

