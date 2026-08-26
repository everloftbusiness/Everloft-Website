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
  console.log("Updating ALL properties in database with 13:00 Check-in, 10:00 Check-out and Full House Rules...");

  const { data: props } = await supabase.from("properties").select("id, name, slug").is("deleted_at", null);

  if (!props || props.length === 0) return;

  console.log(`Syncing ${props.length} property rows...`);

  for (const p of props) {
    if (p.name.includes("Electronic City") || p.name.includes("3BHK") || p.name.includes("New Property") || p.name.includes("404")) {
      await supabase.from("properties").update({
        check_in_time: "13:00",
        check_out_time: "10:00",
      }).eq("id", p.id);

      await supabase.from("property_rules").delete().eq("property_id", p.id);

      const ruleRows = [
        { property_id: p.id, rule_key: "smoking", rule_text: "No smoking inside the home or shared areas" },
        { property_id: p.id, rule_key: "pets", rule_text: "No pets" },
        { property_id: p.id, rule_key: "parties", rule_text: "No loud music or parties (peaceful residential community)" },
        { property_id: p.id, rule_key: "preset", rule_text: "Key collection by building staff during check-in and check-out" },
        { property_id: p.id, rule_key: "preset", rule_text: "Quiet hours observed from 10:00 PM to 8:00 AM" },
        { property_id: p.id, rule_key: "preset", rule_text: "Turn off gas valve, fans, lights, and appliances when not in use" },
        { property_id: p.id, rule_key: "preset", rule_text: "Valid government-issued ID required for all guests after booking" },
        { property_id: p.id, rule_key: "preset", rule_text: "EV charging point available (extra fee applies)" },
        { property_id: p.id, rule_key: "preset", rule_text: "Complimentary toiletries (shower gel, shampoo, dental kits) provided" },
        { property_id: p.id, rule_key: "preset", rule_text: "Suitable for long-term stays" },
      ];

      await supabase.from("property_rules").insert(ruleRows);
      console.log(`  Synced Property: ${p.name} (ID: ${p.id})`);
    }
  }

  console.log("\n🎉 ALL database properties synced successfully!");
}

main();
