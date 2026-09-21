import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cvgrwujjaakqrxasixyf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to run script.");
}

async function main() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey!);
  const testPropertyId = "a79e4cd8-2b76-4905-910b-f51db47d128b";

  console.log("Testing property_integrations table CRUD...");

  // Upsert test row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: upsertData, error: upsertErr } = await (supabase as any)
    .from("property_integrations")
    .upsert(
      {
        property_id: testPropertyId,
        channel: "airbnb",
        listing_url: "https://www.airbnb.com/calendar/ical/test.ics",
        status: "active",
        sync_status: "synced",
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "property_id,channel" }
    )
    .select();

  if (upsertErr) {
    console.error("Upsert Error:", upsertErr);
  } else {
    console.log("Upsert Success! Row:", upsertData);
  }

  // Fetch feeds
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: feeds, error: fetchErr } = await (supabase as any)
    .from("property_integrations")
    .select("*")
    .eq("property_id", testPropertyId)
    .is("deleted_at", null);

  if (fetchErr) {
    console.error("Fetch Error:", fetchErr);
  } else {
    console.log("Fetched Feeds:", feeds);
  }

  // Cleanup test row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("property_integrations").delete().eq("property_id", testPropertyId).eq("channel", "airbnb");
  console.log("Cleanup finished.");
}

main();
