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

function determineCategory(name: string, slug: string): string {
  const lower = (name + " " + slug).toLowerCase();

  if (/generator|power backup|power_backup|inverter|ups|solar|power/i.test(lower)) return "smart_home";
  if (/wifi|wi-fi|internet|workspace|desk|office|ethernet|printer|monitor/i.test(lower)) return "internet_office";
  if (/kitchen|cook|fridge|freezer|refrigerator|stove|oven|dish|dining|cutlery|crockery|microwave|kettle|toaster|coffee|mixer|blender|grinder|water|pan|tawa|plate|bowl|cup|spice|tea|drink|can water/i.test(lower)) return "kitchen_dining";
  if (/bath|shower|soap|shampoo|towel|bidet|toilet|hairdryer|geyser|hot water|conditioner|cleaning|tub|sauna|steam|jacuzzi|chair|grab/i.test(lower)) return "bathroom";
  if (/bed|pillow|blanket|linen|sheet|wardrobe|closet|mattress|cot|crib|nightstand|lamp|hangers|curtain/i.test(lower)) return "bedroom";
  if (/wash|dryer|iron|laundry|rack/i.test(lower)) return "laundry";
  if (/ac\b|air conditioning|cool|fan|heat|climate|fireplace/i.test(lower)) return "heating_cooling";
  if (/park|garage|ev|lift|elevator|entrance|gate|single-level|accessibility|step-free|doorway|handicap|stair|well-lit/i.test(lower)) return "parking_building";
  if (/garden|patio|balcony|pool|deck|outdoor|bbq|lawn|yard|terrace|fire pit|swing|hammock|backyard|view|beach|mountain|lake|river|skyline|resort|ski/i.test(lower)) return "outdoor";
  if (/tv|game|music|book|cinema|projector|speaker|audio|netflix|prime|playstation|xbox|ps5|foosball|hotstar|guidebook|karoke/i.test(lower)) return "entertainment";
  if (/camera|cctv|safe|alarm|extinguisher|guard|lock|security|first aid|medical|contact|lockbox/i.test(lower)) return "safety_security";
  if (/service|check-in|staff|chef|housekeep|long-term|pickup|concierge|greeting|luggage|breakfast|caretaker|pet|dog|cat|baby|child|kid|family|repellent/i.test(lower)) return "guest_services";

  return "kitchen_dining";
}

async function main() {
  // 1. Ensure Generator and Power Backup master amenities exist
  const powerAmenities = [
    { name: "Generator", slug: "generator", category: "smart_home" },
    { name: "Diesel Generator", slug: "diesel_generator", category: "smart_home" },
    { name: "Power Backup (100%)", slug: "power_backup", category: "smart_home" },
    { name: "Inverter Backup", slug: "inverter_backup", category: "smart_home" },
    { name: "UPS Backup", slug: "ups_backup", category: "smart_home" },
    { name: "Solar Power System", slug: "solar_power", category: "smart_home" },
  ];

  for (const item of powerAmenities) {
    const { data: existing } = await supabase
      .from("amenity_master")
      .select("id")
      .or(`slug.eq.${item.slug},name.ilike.${item.name}`)
      .single();

    if (!existing) {
      console.log(`Creating master amenity: "${item.name}"`);
      await supabase.from("amenity_master").insert(item);
    } else {
      await supabase.from("amenity_master").update({ category: "smart_home" }).eq("id", existing.id);
    }
  }

  // 2. Fetch all amenity_master rows and re-categorize
  const { data: amenities, error } = await supabase
    .from("amenity_master")
    .select("id, name, slug, category");

  if (error) {
    console.error("Error fetching amenity_master:", error);
    return;
  }

  console.log(`Found ${amenities.length} total rows in amenity_master:`);

  let updatedCount = 0;
  for (const a of amenities) {
    const newCategory = determineCategory(a.name, a.slug);
    if (newCategory !== a.category) {
      console.log(`Updating: "${a.name}" (${a.category} -> ${newCategory})`);
      const { error: updateErr } = await supabase
        .from("amenity_master")
        .update({ category: newCategory })
        .eq("id", a.id);
      if (!updateErr) updatedCount++;
      else console.error(`Failed to update ${a.name}:`, updateErr.message);
    }
  }

  console.log(`\nSuccessfully re-categorized ${updatedCount} amenities in Supabase!`);

  const { data: updatedAmenities } = await supabase.from("amenity_master").select("name, category");
  const categoryCountsAfter: Record<string, number> = {};
  (updatedAmenities || []).forEach(a => {
    categoryCountsAfter[a.category] = (categoryCountsAfter[a.category] || 0) + 1;
  });
  console.log("\nCounts After Update:", categoryCountsAfter);
}

main();
