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
import { saveManualCalendarBlockAction } from "../features/properties/actions/calendar-sync.actions";
import { getPropertyCalendarBlocks } from "../features/properties/services/ical-sync.service";

async function main() {
  const property = await getPublicActivePropertyBySlug("305-stylish-2bhk-by-everloft-with-balcony");
  if (!property) {
    console.error("Property 305 not found!");
    process.exit(1);
  }

  console.log(`Testing manual block for Property: ${property.name} (${property.id})`);

  const res = await saveManualCalendarBlockAction(
    property.id,
    "2026-09-25",
    "2026-09-28",
    "Test Block via Dashboard UI"
  );

  console.log("saveManualCalendarBlockAction result:", res);

  const updatedBlocks = await getPropertyCalendarBlocks(property.id);
  console.log("Updated blocks in DB:", updatedBlocks);
}

main().catch(console.error);
