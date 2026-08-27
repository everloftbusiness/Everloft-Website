import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Setting ALL properties to Active status so they load on public website...");

  const { data: activeStatus } = await supabase
    .from("property_status")
    .select("id")
    .eq("slug", "active")
    .single();

  if (!activeStatus) {
    console.error("Active status not found");
    return;
  }

  const { data: updated, error } = await supabase
    .from("properties")
    .update({ status_id: activeStatus.id })
    .is("deleted_at", null)
    .select("id, name, slug");

  if (error) {
    console.error("Failed to update status:", error);
    return;
  }

  console.log(`Successfully activated ${updated?.length || 0} properties!`);
  (updated || []).forEach(p => console.log(`  - Activated: "${p.name}" (Slug: http://localhost:3000/properties/${p.slug})`));
}

main();
