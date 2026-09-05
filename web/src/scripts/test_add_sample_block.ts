import * as dotenv from "dotenv";
import * as path from "path";

require("module")._cache[require.resolve("server-only")] = {
  id: require.resolve("server-only"),
  filename: require.resolve("server-only"),
  loaded: true,
  exports: {},
};

dotenv.config({ path: path.join(process.cwd(), ".env") });

import { getPublicActivePropertyBySlug } from "../features/properties/services/properties.service";
import {
  getPropertyCalendarBlocks,
  savePropertyCalendarBlocks,
} from "../features/properties/services/ical-sync.service";

async function main() {
  const property = await getPublicActivePropertyBySlug("305-stylish-2bhk-by-everloft-with-balcony");
  if (!property) {
    console.error("Property 305 not found!");
    process.exit(1);
  }

  console.log(`Property: ${property.name} (${property.id})`);

  const existing = await getPropertyCalendarBlocks(property.id);
  console.log("Existing blocks:", existing);

  // Add sample reservation / block
  const sampleBlocks = [
    {
      id: `blk_sample_1`,
      propertyId: property.id,
      startDate: "2026-09-10",
      endDate: "2026-09-15",
      reason: "airbnb_sync" as const,
      channelName: "Airbnb",
      notes: "Airbnb Reservation - Reserved",
    },
    {
      id: `blk_sample_2`,
      propertyId: property.id,
      startDate: "2026-09-20",
      endDate: "2026-09-22",
      reason: "manual_block" as const,
      channelName: "Maintenance",
      notes: "Maintenance Block",
    },
  ];

  await savePropertyCalendarBlocks(property.id, sampleBlocks);
  console.log("Saved 2 sample calendar blocks for Property 305!");

  const updated = await getPropertyCalendarBlocks(property.id);
  console.log("Updated blocks fetched from DB:", updated);
}

main().catch(console.error);
