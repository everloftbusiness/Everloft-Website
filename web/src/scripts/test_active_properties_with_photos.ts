import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("Checking photo counts for Active properties...");

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: activeStatus } = await supabase.from("property_status").select("id").eq("slug", "active").single();
  const { data: properties } = await supabase.from("properties").select("id, name, slug").eq("status_id", activeStatus?.id).is("deleted_at", null);
  const { data: photos } = await supabase.from("property_photos").select("property_id").is("deleted_at", null);

  console.log(`\nActive Properties Count: ${properties?.length || 0}`);
  (properties || []).forEach((p) => {
    const photoCount = (photos || []).filter((ph) => ph.property_id === p.id).length;
    console.log(`  • "${p.name}" (Slug: ${p.slug}) ➔ Photos: ${photoCount} ${photoCount === 0 ? "❌ (SHOWS PHOTO COMING SOON)" : "✅"}`);
  });
}

main();
