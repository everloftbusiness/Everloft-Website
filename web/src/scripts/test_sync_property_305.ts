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
  getICalChannelFeeds,
  getPropertyCalendarBlocks,
  syncAllICalFeeds,
} from "../features/properties/services/ical-sync.service";

async function main() {
  const property = await getPublicActivePropertyBySlug("305-stylish-2bhk-by-everloft-with-balcony");
  if (!property) {
    console.error("Property not found!");
    process.exit(1);
  }

  console.log(`Property: ${property.name} (${property.id})`);

  const feeds = await getICalChannelFeeds(property.id);
  console.log("Configured iCal Feeds:", feeds);

  const initialBlocks = await getPropertyCalendarBlocks(property.id);
  console.log("Initial Calendar Blocks Count:", initialBlocks.length);
  console.log("Initial Calendar Blocks:", initialBlocks);

  if (feeds.length > 0) {
    console.log("\nExecuting syncAllICalFeeds...");
    const syncRes = await syncAllICalFeeds(property.id);
    console.log("Sync Result:", syncRes);

    const updatedBlocks = await getPropertyCalendarBlocks(property.id);
    console.log("Updated Calendar Blocks Count:", updatedBlocks.length);
    console.log("Updated Calendar Blocks:", updatedBlocks);
  } else {
    console.log("\nNo iCal feeds configured for this property.");
  }
}

main().catch(console.error);
