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
  console.log("Checking Property Statuses in Database...");

  const { data: statuses } = await supabase.from("property_status").select("id, slug, name");
  console.log("Property Status Table:", statuses);

  const activeStatus = statuses?.find(s => s.slug === "active");
  console.log("Active Status Object:", activeStatus);

  const { data: props } = await supabase.from("properties").select("id, name, slug, status_id").is("deleted_at", null);
  console.log(`\nTotal Properties Count: ${props?.length || 0}`);

  (props || []).forEach(p => {
    const s = statuses?.find(st => st.id === p.status_id);
    console.log(`  Property: "${p.name}"`);
    console.log(`    Slug: "${p.slug}"`);
    console.log(`    Status ID: "${p.status_id}" ➔ Status Slug: "${s?.slug || "UNKNOWN"}"`);
  });
}

main();
