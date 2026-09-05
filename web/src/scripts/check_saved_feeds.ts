import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { getICalChannelFeeds, syncAllICalFeeds, getPropertyCalendarBlocks } from "../features/properties/services/ical-sync.service";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cvgrwujjaakqrxasixyf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Z3J3dWpqYWFrcXJ4YXNpeHlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQxODk0NiwiZXhwIjoyMTAwOTk0OTQ2fQ.2eb1XRoBVX0kSqXjquuOdIH-6gmpTi3Dh5l9zaqCAIA";

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
