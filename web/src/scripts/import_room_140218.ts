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
  console.log("Updating Listing 1402181733992588218 with Full Description & House Rules...");

  const roomId = "1402181733992588218";
  const slug = `stylish-3bhk-in-electronic-city-${roomId.slice(-6)}`;

  const fullDescription = `Welcome to Everloft's premium 3BHK apartment located in the heart of Electronic City, Bengaluru.

The Space:
This beautifully designed 3-bedroom residence features spacious air-conditioned bedrooms, a modern fully equipped kitchenette with stove, microwave, refrigerator, and crockery, comfortable living area with Smart TV, and a private balcony offering serene views.

Guest Access:
Guests have exclusive access to the entire 3BHK unit, private balcony, high-speed Wi-Fi, elevator access, free parking, and 24/7 building staff & caretaker assistance.

Location & Surroundings:
Situated in Electronic City Phase 1, near major tech parks, dining hubs, and transport links — making it ideal for families, corporate professionals, and group stays.`;

  // 1. Find property
  const { data: prop } = await supabase.from("properties").select("id").eq("slug", slug).single();
  if (!prop) {
    console.error("Property not found!");
    return;
  }

  const propertyId = prop.id;

  // 2. Update Description & Timings
  await supabase.from("properties").update({
    description: fullDescription,
    short_description: "3 BHK Apartment in Electronic City with Balcony Views & Modern Amenities",
    check_in_time: "13:00",
    check_out_time: "10:00",
  }).eq("id", propertyId);

  console.log("Updated property description & check-in/check-out timings!");

  // 3. Update property_rules with preset & boolean keys for UI display
  await supabase.from("property_rules").delete().eq("property_id", propertyId);

  const ruleRows = [
    { property_id: propertyId, rule_key: "smoking", rule_text: "No smoking" },
    { property_id: propertyId, rule_key: "pets", rule_text: "No pets" },
    { property_id: propertyId, rule_key: "parties", rule_text: "No parties or events" },
    { property_id: propertyId, rule_key: "preset", rule_text: "Self check-in with building staff & keylock" },
    { property_id: propertyId, rule_key: "preset", rule_text: "Quiet hours observed from 10:00 PM to 8:00 AM" },
    { property_id: propertyId, rule_key: "preset", rule_text: "Suitable for long-term stays" },
  ];

  await supabase.from("property_rules").insert(ruleRows);
  console.log("Updated property_rules with full house rules & preset keys!");

  console.log(`\n🎉 SUCCESS! Listing ${roomId} description & house rules are fully updated!`);
}

main();
