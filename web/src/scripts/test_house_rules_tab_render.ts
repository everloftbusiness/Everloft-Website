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
  const { data: props } = await supabase.from("properties").select("id, name, check_in_time, check_out_time").is("deleted_at", null).order("created_at", { ascending: false });

  if (!props || props.length === 0) return;
  const p = props[0];

  console.log(`Checking stored rules for top property: ${p.name} (${p.id})`);

  const { data: rules } = await supabase.from("property_rules").select("rule_key, rule_text").eq("property_id", p.id).is("deleted_at", null);

  const ruleMap = new Map((rules ?? []).map((r) => [r.rule_key, r.rule_text]));

  console.log("==========================================");
  console.log("Check-in Time:", p.check_in_time);
  console.log("Check-out Time:", p.check_out_time);
  console.log("Smoking Rule text in DB:", ruleMap.get("smoking"));
  console.log("Pets Rule text in DB:", ruleMap.get("pets"));
  console.log("Parties Rule text in DB:", ruleMap.get("parties"));

  const smokingAllowed = (ruleMap.get("smoking") ?? "").includes("allowed") && !(ruleMap.get("smoking") ?? "").startsWith("No");
  const petsAllowed = (ruleMap.get("pets") ?? "").includes("allowed") && !(ruleMap.get("pets") ?? "").startsWith("No");
  const partiesAllowed = (ruleMap.get("parties") ?? "").includes("allowed") && !(ruleMap.get("parties") ?? "").startsWith("No");

  console.log("Evaluated smokingAllowed boolean:", smokingAllowed);
  console.log("Evaluated petsAllowed boolean:", petsAllowed);
  console.log("Evaluated partiesAllowed boolean:", partiesAllowed);

  const presetRuleTexts = (rules ?? []).filter((r) => r.rule_key === "preset").map((r) => r.rule_text);
  const customRuleTexts = (rules ?? []).filter((r) => r.rule_key === "custom").map((r) => r.rule_text);

  console.log("Preset Rule Texts (Count: " + presetRuleTexts.length + "):");
  presetRuleTexts.forEach(r => console.log("  - ", r));
  console.log("Custom Rule Texts (Count: " + customRuleTexts.length + "):");
  customRuleTexts.forEach(r => console.log("  - ", r));
  console.log("==========================================");
}

main();
