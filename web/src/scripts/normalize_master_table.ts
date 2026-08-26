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

// Merges raw lower versions into canonical versions
const SYNONYM_MERGES: Record<string, string> = {
  "bed linen": "Bed Linen & Sheets",
  "bed linens": "Bed Linen & Sheets",
  "wardrobe": "Wardrobe & Closet",
  "extra pillows & blankets": "Extra Pillows & Blankets",
  "fridge": "Refrigerator & Freezer",
  "refrigerator": "Refrigerator & Freezer",
  "freezer": "Refrigerator & Freezer",
  "crockery and cutlery": "Crockery & Cutlery",
  "cutlery": "Crockery & Cutlery",
  "coffee maker": "Coffee Machine",
  "gas cooker": "Gas Stove",
  "lpg gas stove": "Gas Stove",
  "full kitchen": "Kitchenette",
  "kitchen": "Kitchenette",
  "mixer / blender": "Mixer Grinder",
  "drinking water": "Water Purifier",
  "ro water": "Water Purifier",
  "can water": "Water Purifier",
  "hot water": "Geyser & Hot Water",
  "clothes dryer": "Dryer",
  "tumble dryer": "Dryer",
  "iron": "Iron & Board",
  "hair dryer": "Hairdryer",
  "elevator": "Elevator / Lift",
  "lift": "Elevator / Lift",
  "elevator access": "Elevator / Lift",
  "free parking": "Car Parking",
  "free parking on premises": "Car Parking",
  "balcony": "Balcony / Patio",
  "patio": "Balcony / Patio",
  "private patio or balcony": "Balcony / Patio",
  "garden": "Garden / Lawn",
  "garden / lawn": "Garden / Lawn",
  "shared back garden – fully fenced": "Garden / Lawn",
  "bbq": "BBQ Grill",
  "tv": "Smart TV",
  "cable tv": "Smart TV",
  "books": "Books & Reading Material",
  "books and reading material": "Books & Reading Material",
  "cinema": "Cinema & Projector",
  "home theatre": "Cinema & Projector",
  "bluetooth speaker": "Soundbar & Speakers",
  "cctv": "CCTV Cameras",
  "cctv (outdoor)": "CCTV Cameras",
  "cctv at entrance": "CCTV Cameras",
  "smart lock": "Digital Door Lock",
  "lockbox": "Digital Door Lock",
  "first aid kit": "Medical Kit",
  "smoke alarm": "Smoke Alarm",
  "building staff": "Building Staff & Caretaker",
  "caretaker": "Building Staff & Caretaker",
  "caretaker / staff": "Building Staff & Caretaker",
  "caretaker on call": "Building Staff & Caretaker",
  "housekeeping": "Housekeeping Services",
  "daily housekeeping": "Housekeeping Services",
  "breakfast": "Breakfast Included",
  "wifi": "High-speed Wi-Fi",
  "workspace": "Dedicated Workspace",
  "power backup": "UPS Backup",
};

async function main() {
  console.log("Merging casing and synonym duplicates in amenity_master...");

  const { data: allRows } = await supabase.from("amenity_master").select("id, name, slug, category");
  if (!allRows) return;

  const nameMap = new Map(allRows.map(r => [r.name, r]));

  for (const row of allRows) {
    const canonicalName = SYNONYM_MERGES[row.name.toLowerCase()];
    if (canonicalName && canonicalName !== row.name) {
      const canonicalTarget = nameMap.get(canonicalName);
      if (canonicalTarget && canonicalTarget.id !== row.id) {
        console.log(`Merging "${row.name}" -> "${canonicalName}"`);
        // Reassign property_amenities references to canonicalTarget.id
        await supabase.from("property_amenities").update({ amenity_id: canonicalTarget.id }).eq("amenity_id", row.id);
        // Delete redundant row
        await supabase.from("amenity_master").delete().eq("id", row.id);
      } else {
        // Update row name to canonicalName
        await supabase.from("amenity_master").update({ name: canonicalName }).eq("id", row.id);
      }
    }
  }

  const { data: finalRows } = await supabase.from("amenity_master").select("id, name, category");
  console.log(`\nFinal Clean Unique Amenity Count: ${finalRows?.length || 0}`);
}

main();
