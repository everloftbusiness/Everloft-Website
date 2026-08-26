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
  console.log("Checking House Rules stored in database across all properties...");

  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, slug, check_in_time, check_out_time")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!properties || properties.length === 0) {
    console.log("No properties found.");
    return;
  }

  for (const p of properties.slice(0, 10)) {
    const { data: rules } = await supabase
      .from("property_rules")
      .select("id, rule_key, rule_text")
      .eq("property_id", p.id)
      .is("deleted_at", null);

    console.log(`\n==========================================`);
    console.log(`PROPERTY: ${p.name}`);
    console.log(`ID: ${p.id}`);
    console.log(`Slug: ${p.slug}`);
    console.log(`Check-in: ${p.check_in_time}, Check-out: ${p.check_out_time}`);
    console.log(`Rules Count: ${rules?.length || 0}`);
    console.log(`Stored Rules:`);
    (rules || []).forEach(r => console.log(`  [${r.rule_key}] -> "${r.rule_text}"`));
  }
}

main();
