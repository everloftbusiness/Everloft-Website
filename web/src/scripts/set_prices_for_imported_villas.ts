import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("Setting base prices and Active status for imported properties with photos...");

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: activeStatus } = await supabase.from("property_status").select("id").eq("slug", "active").single();
  if (!activeStatus) return;

  const { data: properties } = await supabase.from("properties").select("id, name, slug").is("deleted_at", null);
  const { data: photos } = await supabase.from("property_photos").select("property_id").is("deleted_at", null);

  for (const p of properties || []) {
    const photoCount = (photos || []).filter((ph) => ph.property_id === p.id).length;

    // If property has 5+ photos and is a main imported listing, set base price
    if (photoCount >= 5) {
      let price = 3500;
      if (p.name.includes("3BHK")) price = 4500;
      if (p.name.includes("2BHK")) price = 3200;
      if (p.name.includes("1BHK")) price = 2200;
      if (p.name.includes("306")) price = 2800;

      // Upsert pricing
      await supabase.from("property_pricing").upsert({
        property_id: p.id,
        base_price: price,
        currency: "INR",
      }, { onConflict: "property_id" });

      // Mark Active
      await supabase.from("properties").update({ status_id: activeStatus.id }).eq("id", p.id);
      console.log(`  • Activated with Price ₹${price} + GST: "${p.name}" (Slug: ${p.slug}, Photos: ${photoCount})`);
    }
  }

  console.log("\n🎉 All complete properties with photos updated with Base Price & Active status!");
}

main();
