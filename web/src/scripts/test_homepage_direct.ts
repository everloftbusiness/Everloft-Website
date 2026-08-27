import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("Testing Home Screen Featured Properties...");

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: activeStatus } = await supabase.from("property_status").select("id").eq("slug", "active").single();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, slug")
    .eq("status_id", activeStatus?.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(6);

  const propertyIds = (properties || []).map((p) => p.id);
  const { data: photos } = await supabase
    .from("property_photos")
    .select("property_id, file_id, is_cover")
    .in("property_id", propertyIds)
    .is("deleted_at", null)
    .order("is_cover", { ascending: false });

  const fileIds = (photos || []).map((ph) => ph.file_id);
  const { data: files } = await supabase.from("files").select("id, public_url, bucket, object_key").in("id", fileIds);

  const fileMap = new Map((files || []).map((f) => [f.id, f.public_url || `https://pub-ceafc7e3144f4cf0be1a828c0ec9f85c.r2.dev/${f.bucket}/${f.object_key}`]));

  const coverFileByProperty = new Map<string, string>();
  for (const photo of photos || []) {
    if (!coverFileByProperty.has(photo.property_id) || photo.is_cover) {
      coverFileByProperty.set(photo.property_id, photo.file_id);
    }
  }

  console.log(`\nFound ${properties?.length || 0} active properties for Home Screen:`);
  (properties || []).forEach((p, i) => {
    const fileId = coverFileByProperty.get(p.id);
    const url = fileId ? fileMap.get(fileId) : null;
    console.log(`  [Card #${i + 1}] "${p.name}"`);
    console.log(`     -> Cover Photo URL: ${url}`);
  });
}

main();
