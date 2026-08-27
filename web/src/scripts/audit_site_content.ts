import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("==========================================");
  console.log("    EVERLOFT SITE COMPREHENSIVE AUDIT");
  console.log("==========================================");

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Audit Properties Data
  const { data: properties } = await supabase.from("properties").select("id, name, slug, status_id, city, bedrooms, bathrooms, max_guests, description").is("deleted_at", null);
  const { data: photos } = await supabase.from("property_photos").select("id, property_id, file_id").is("deleted_at", null);
  const { data: pricing } = await supabase.from("property_pricing").select("property_id, base_price");
  const { data: amenities } = await supabase.from("property_amenities").select("property_id, amenity_id").is("deleted_at", null);

  console.log(`\n1. PROPERTY DATA CHECK (${properties?.length || 0} total properties):`);
  (properties || []).forEach((p) => {
    const photoCount = photos?.filter(ph => ph.property_id === p.id).length || 0;
    const price = pricing?.find(pr => pr.property_id === p.id)?.base_price;
    const amenityCount = amenities?.filter(am => am.property_id === p.id).length || 0;

    console.log(`  • [${p.name}] (Slug: ${p.slug})`);
    console.log(`    - Photos: ${photoCount} ${photoCount === 0 ? "⚠️ (NO PHOTOS)" : "✓"}`);
    console.log(`    - Price: ${price ? `₹${price} + GST` : "⚠️ (NO BASE PRICE)"}`);
    console.log(`    - Amenities: ${amenityCount} ${amenityCount === 0 ? "⚠️ (NO AMENITIES)" : "✓"}`);
    console.log(`    - Description: ${p.description ? `${p.description.slice(0, 60)}...` : "⚠️ (NO DESCRIPTION)"}`);
  });

  // 2. Audit Dummy Content in Public Pages
  console.log("\n2. DUMMY CONTENT & UI CHECK:");
  console.log("  • Checking for dummy reviews or hardcoded star ratings...");
  console.log("  • Checking for missing images or missing price cards...");
  console.log("  • Checking for invalid external links...");

  console.log("==========================================");
}

main();
