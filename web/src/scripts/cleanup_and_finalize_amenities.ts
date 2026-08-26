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

// Map of misplaced item name -> correct category
const MISPLACED_FIXES: Record<string, string> = {
  "Cups": "kitchen_dining",
  "Gym": "parking_building",
  "Steam room": "bathroom",
  "Sauna": "bathroom",
  "Jacuzzi": "bathroom",
  "Hot tub": "bathroom",
  "Essentials": "bathroom",
  "Outlet covers": "safety_security",
  "High Chair": "guest_services",
  "Cleaning during stay": "guest_services",
  "CCTV": "safety_security",
  "CCTV (Outdoor)": "safety_security",
  "CCTV at entrance": "safety_security",
  "Solar Water Heater": "heating_cooling",
  "Home theatre": "entertainment",
};

// Duplicates to delete from amenity_master if clean canonical exists
const DUPLICATES_TO_REMOVE = [
  "EV charger – level 1",
  "Free parking on premises",
  "Shared back garden – Fully fenced",
  "Private patio or balcony",
  "Clothes storage: wardrobe and chest of drawers",
  "Exterior security cameras on property",
  "Power Backup / Inverter",
  "UPS",
  "Inverter backup",
  "Bed linens",
  "Prime Video",
  "PS5",
  "WiFi",
];

async function main() {
  console.log("Starting Amenity Master Cleanup & Recategorization...");

  // 1. Fix misplaced categories
  for (const [itemName, correctCat] of Object.entries(MISPLACED_FIXES)) {
    const { error } = await supabase
      .from("amenity_master")
      .update({ category: correctCat })
      .ilike("name", itemName);
    if (!error) console.log(`  Fixed misplaced item: "${itemName}" -> ${correctCat}`);
  }

  // 2. Remove redundant messy duplicate rows
  for (const dupName of DUPLICATES_TO_REMOVE) {
    // First remove references from property_amenities table
    const { data: found } = await supabase.from("amenity_master").select("id").eq("name", dupName);
    if (found && found.length > 0) {
      for (const item of found) {
        await supabase.from("property_amenities").delete().eq("amenity_id", item.id);
        await supabase.from("amenity_master").delete().eq("id", item.id);
      }
      console.log(`  Removed duplicate row: "${dupName}"`);
    }
  }

  // 3. Clean up power backup items into smart_home category
  const powerItems = ["Generator", "Diesel Generator", "Power Backup (100%)", "Power Backup", "Inverter Backup", "UPS Backup", "Solar Power System"];
  for (const pName of powerItems) {
    await supabase.from("amenity_master").update({ category: "smart_home" }).ilike("name", pName);
  }

  console.log("\nCleanup Complete! Re-querying database state...");

  const { data: amenities } = await supabase
    .from("amenity_master")
    .select("id, name, slug, category")
    .order("name", { ascending: true });

  console.log(`\nFinal Clean Count: ${amenities?.length || 0} Amenities`);
}

main();
