import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("Setting properties with 0 photos or missing prices to Draft status...");

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: draftStatus } = await supabase.from("property_status").select("id").eq("slug", "draft").single();
  const { data: activeStatus } = await supabase.from("property_status").select("id").eq("slug", "active").single();

  if (!draftStatus || !activeStatus) return;

  const { data: properties } = await supabase.from("properties").select("id, name, slug").is("deleted_at", null);
  const { data: photos } = await supabase.from("property_photos").select("property_id").is("deleted_at", null);
  const { data: pricing } = await supabase.from("property_pricing").select("property_id, base_price");

  for (const p of properties || []) {
    const photoCount = (photos || []).filter((ph) => ph.property_id === p.id).length;
    const hasPrice = Boolean((pricing || []).find((pr) => pr.property_id === p.id && pr.base_price));

    // If a property has 0 photos, mark it as Draft
    if (photoCount === 0 || !hasPrice) {
      await supabase.from("properties").update({ status_id: draftStatus.id }).eq("id", p.id);
      console.log(`  • Set to Draft (Incomplete): "${p.name}" (Photos: ${photoCount}, HasPrice: ${hasPrice})`);
    } else {
      await supabase.from("properties").update({ status_id: activeStatus.id }).eq("id", p.id);
      console.log(`  • Kept Active (Complete): "${p.name}" (Photos: ${photoCount}, Price: YES)`);
    }
  }

  console.log("\n🎉 Database statuses updated! Only 100% complete listings are Active.");
}

main();
