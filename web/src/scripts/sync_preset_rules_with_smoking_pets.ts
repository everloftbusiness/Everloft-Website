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
  console.log("Syncing property_rules so No smoking, No pets, No events or parties are included as preset rows...");

  const { data: props } = await supabase.from("properties").select("id, name").is("deleted_at", null);
  if (!props) return;

  for (const p of props) {
    if (p.name.includes("Electronic City") || p.name.includes("3BHK")) {
      await supabase.from("property_rules").delete().eq("property_id", p.id);

      const ruleRows = [
        { property_id: p.id, rule_key: "smoking", rule_text: "No smoking" },
        { property_id: p.id, rule_key: "pets", rule_text: "No pets" },
        { property_id: p.id, rule_key: "parties", rule_text: "No events or parties" },

        { property_id: p.id, rule_key: "preset", rule_text: "No smoking" },
        { property_id: p.id, rule_key: "preset", rule_text: "No pets" },
        { property_id: p.id, rule_key: "preset", rule_text: "No events or parties" },
        { property_id: p.id, rule_key: "preset", rule_text: "Self check-in available" },
        { property_id: p.id, rule_key: "preset", rule_text: "Quiet hours (e.g., 10 PM–7 AM)" },
        { property_id: p.id, rule_key: "preset", rule_text: "Turn off lights, fans, and AC when leaving" },
        { property_id: p.id, rule_key: "preset", rule_text: "ID verification required" },
        { property_id: p.id, rule_key: "preset", rule_text: "EV charging only with permission" },
        { property_id: p.id, rule_key: "preset", rule_text: "Long-term stays allowed" },
      ];

      await supabase.from("property_rules").insert(ruleRows);
      console.log(`  Synced 9 preset rule rows for Property: ${p.name} (${p.id})`);
    }
  }

  console.log("\n🎉 ALL property preset rule rows synced successfully!");
}

main();
