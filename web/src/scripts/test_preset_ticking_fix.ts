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
  console.log("Checking presetRuleTexts across all properties...");

  const { data: props } = await supabase.from("properties").select("id, name").is("deleted_at", null);
  if (!props) return;

  for (const p of props) {
    if (p.name.includes("Electronic City") || p.name.includes("3BHK")) {
      const { data: rules } = await supabase.from("property_rules").select("rule_key, rule_text").eq("property_id", p.id).is("deleted_at", null);

      const presets = (rules ?? []).filter(r => r.rule_key === "preset").map(r => r.rule_text);
      const smokingRule = (rules ?? []).find(r => r.rule_key === "smoking")?.rule_text;
      const petsRule = (rules ?? []).find(r => r.rule_key === "pets")?.rule_text;
      const partiesRule = (rules ?? []).find(r => r.rule_key === "parties")?.rule_text;

      console.log(`Property: ${p.name}`);
      console.log(`  smokingRule: "${smokingRule}"`);
      console.log(`  petsRule: "${petsRule}"`);
      console.log(`  partiesRule: "${partiesRule}"`);
      console.log(`  presetRuleTexts (${presets.length}):`, presets);
    }
  }
}

main();
