import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: properties } = await supabase.from("properties").select("id, name, slug, status_id").is("deleted_at", null);
  const { data: statusList } = await supabase.from("property_status").select("id, slug, name");
  const statusMap = new Map((statusList || []).map((s) => [s.id, s.slug]));

  const { data: photos } = await supabase.from("property_photos").select("id, property_id, file_id").is("deleted_at", null);

  console.log("\nDEBUGGING PROPERTY PHOTO LINKAGES:");
  (properties || []).forEach((p) => {
    const status = statusMap.get(p.status_id) || "unknown";
    const propertyPhotos = (photos || []).filter((ph) => ph.property_id === p.id);
    console.log(`• [${status.toUpperCase()}] "${p.name}" (Slug: ${p.slug}) ➔ Photos: ${propertyPhotos.length}`);
    if (propertyPhotos.length > 0) {
      console.log(`    Sample File ID: ${propertyPhotos[0].file_id}`);
    }
  });
}

main();
