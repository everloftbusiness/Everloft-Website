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

const USER_DESCRIPTION = `Welcome to your home away from home in the heart of Electronic City!
This spacious, stylish 3BHK apartment is perfect for families, business travelers, professionals, and groups who are looking for comfort, convenience, and a touch of luxury.

✨ Enjoy bright, airy interiors, modern furnishings, and private balconies
✨ Relax in the cozy living room or cook your favorite meals in the fully equipped kitchen
✨ Ideal for short getaways, business trips, or long stays

The Space:
📌 Home Highlights
- A spacious 3-bedroom apartment ideal for up to 6 guests
- Fourth Floor location with lift access directly from the car park
- 4 Balconies: 1 spacious main balcony + 3 private attached bedroom balconies
- 2 Bathrooms with 24-hour hot water geysers, shower gel, shampoo, and dental kits
- Living area with cozy 3+1 seater sofa
- Fully equipped kitchen with gas stove, cooker hood, microwave, fridge, automatic top-load washing machine, crockery, and cutlery
- Just 20-minute drive from major hospitals in Bommasandra (ideal for medical professionals and families)

Guest Access:
- Complete private access to the entire apartment
- Access to kitchen, washing machine, balconies, parking space, Wi-Fi, and inverter backup
- Building staff will hand over and collect keys during check-in and check-out

Other Details to Note:
- Free onsite parking for cars and two-wheelers; EV charging point available (extra fee)
- Inverter backup supports essential lights, fans, and TV during power cuts
- Strict non-smoking policy inside the home and shared areas
- No loud music or parties (peaceful residential community)
- Valid government-issued ID required for all guests`;

async function main() {
  console.log("Updating database properties with user-provided full description and house rules...");

  // Fetch all matching Electronic City properties
  const { data: props } = await supabase
    .from("properties")
    .select("id, name, slug")
    .ilike("name", "%Electronic City%");

  if (!props || props.length === 0) {
    console.log("No matching properties found.");
    return;
  }

  console.log(`Updating ${props.length} property instances...`);

  for (const p of props) {
    // 1. Update Description & Short Description
    await supabase.from("properties").update({
      description: USER_DESCRIPTION,
      short_description: "Spacious & stylish 3BHK in Electronic City with 4 balconies, full kitchen, Wi-Fi & inverter backup.",
      check_in_time: "13:00",
      check_out_time: "10:00",
    }).eq("id", p.id);

    // 2. Update property_rules with exact rules provided
    await supabase.from("property_rules").delete().eq("property_id", p.id);

    const ruleRows = [
      { property_id: p.id, rule_key: "smoking", rule_text: "No smoking inside the home or shared areas" },
      { property_id: p.id, rule_key: "pets", rule_text: "No pets" },
      { property_id: p.id, rule_key: "parties", rule_text: "No loud music or parties (peaceful residential community)" },
      { property_id: p.id, rule_key: "preset", rule_text: "Key collection by building staff during check-in and check-out" },
      { property_id: p.id, rule_key: "preset", rule_text: "Turn off gas valve, fans, lights, and appliances when not in use" },
      { property_id: p.id, rule_key: "preset", rule_text: "Valid government-issued ID required for all guests after booking" },
      { property_id: p.id, rule_key: "preset", rule_text: "Complimentary toiletries (shower gel, shampoo, dental kits) provided" },
      { property_id: p.id, rule_key: "preset", rule_text: "EV charging point available (extra fee applies)" },
    ];

    await supabase.from("property_rules").insert(ruleRows);
    console.log(`  Updated Property: ${p.name} (ID: ${p.id})`);
  }

  console.log("\n🎉 SUCCESS! All property records updated with exact user-provided text!");
}

main();
