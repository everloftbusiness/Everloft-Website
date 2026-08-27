import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: activeStatus } = await supabase.from("property_status").select("id").eq("slug", "active").single();
  const { data: properties } = await supabase.from("properties").select("id, name, slug").eq("status_id", activeStatus?.id).is("deleted_at", null);
  const propertyIds = (properties || []).map((p) => p.id);

  console.log(`Property IDs (${propertyIds.length}):`, propertyIds);

  const { data: photos, error: pErr } = await supabase
    .from("property_photos")
    .select("id, property_id, file_id, is_cover")
    .in("property_id", propertyIds)
    .is("deleted_at", null);

  console.log(`Photos query result (${photos?.length || 0}):`, pErr || photos?.slice(0, 3));

  if (photos && photos.length > 0) {
    const fileIds = photos.map((ph) => ph.file_id);
    const { data: files, error: fErr } = await supabase
      .from("files")
      .select("id, public_url, bucket, object_key")
      .in("id", fileIds);

    console.log(`Files query result (${files?.length || 0}):`, fErr || files?.slice(0, 3));
  }
}

main();
