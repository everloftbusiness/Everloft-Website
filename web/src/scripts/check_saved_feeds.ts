import * as dotenv from "dotenv";
import * as path from "path";
import { getICalChannelFeeds, syncAllICalFeeds, getPropertyCalendarBlocks } from "../features/properties/services/ical-sync.service";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SECRET_KEY is required to run script.");
}

async function main() {
  const propertyId = "a79e4cd8-2b76-4905-910b-f51db47d128b";
  console.log("Checking saved feeds in DB for property", propertyId);

  const feeds = await getICalChannelFeeds(propertyId);
  console.log("Saved Feeds:", feeds);

  const syncRes = await syncAllICalFeeds(propertyId, true);
  console.log("Sync Result:", syncRes);

  const blocks = await getPropertyCalendarBlocks(propertyId);
  console.log("Blocks in DB after sync:", blocks);
}

main();
