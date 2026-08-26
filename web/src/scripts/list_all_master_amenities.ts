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

const CATEGORY_NAMES: Record<string, string> = {
  power_utilities: "⚡ Power Backup & Utilities",
  smart_home: "⚡ Power Backup & Utilities",
  internet_office: "📶 Internet & Workspace",
  kitchen_dining: "🍽️ Kitchen & Dining",
  bathroom: "🛁 Bathroom",
  bedroom: "🛏️ Bedroom",
  laundry: "🧺 Laundry & Washing",
  heating_cooling: "❄️ Heating & Cooling",
  parking_building: "🚗 Parking & Building Facilities",
  outdoor: "🏞️ Outdoor & Leisure",
  entertainment: "🎭 Entertainment & Games",
  safety_security: "🛡️ Safety & Security",
  guest_services: "🛎️ Guest Services",
  essentials: "✨ Essentials",
};

async function main() {
  const { data: amenities, error } = await supabase
    .from("amenity_master")
    .select("id, name, slug, category")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching amenities:", error);
    return;
  }

  const grouped: Record<string, string[]> = {};
  amenities.forEach(a => {
    const catLabel = CATEGORY_NAMES[a.category] || a.category;
    (grouped[catLabel] ??= []).push(a.name);
  });

  console.log(`\n================ ALL MASTER AMENITIES (${amenities.length}) ================`);
  for (const cat in grouped) {
    const unique = [...new Set(grouped[cat])].sort();
    console.log(`\n### ${cat} (${unique.length} items):`);
    unique.forEach(name => console.log(`- ${name}`));
  }
}

main();
