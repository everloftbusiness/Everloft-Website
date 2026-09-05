import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { getPropertyCalendarBlocks, savePropertyCalendarBlocks } from "../features/properties/services/ical-sync.service";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function main() {
  const propertyId = "a79e4cd8-2b76-4905-910b-f51db47d128b";
  console.log("Cleaning up duplicate blocks in DB for property", propertyId);

  const blocks = await getPropertyCalendarBlocks(propertyId);
  console.log("Blocks loaded before deduplication:", blocks.length);

  // Save back via savePropertyCalendarBlocks, which now deduplicates and re-inserts clean rows
  await savePropertyCalendarBlocks(propertyId, blocks);

  const cleanBlocks = await getPropertyCalendarBlocks(propertyId);
  console.log("Blocks in DB after deduplication cleanup:", cleanBlocks.length);
  console.log("Clean Blocks List:", cleanBlocks);
}

main();
