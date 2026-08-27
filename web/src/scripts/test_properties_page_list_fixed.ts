import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEFAULT_R2_PUBLIC_BASE_URL = "https://pub-ceafc7e3144f4cf0be1a828c0ec9f85c.r2.dev";

async function main() {
  console.log("Testing FIXED cover photo resolution for /properties page...");

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: activeStatus } = await supabase.from("property_status").select("id").eq("slug", "active").single();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, slug")
    .eq("status_id", activeStatus?.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(100);

  const propertyIds = (properties || []).map((p) => p.id);
  const { data: photos } = await supabase
    .from("property_photos")
    .select("property_id, file_id, is_cover")
    .in("property_id", propertyIds)
    .is("deleted_at", null)
    .order("is_cover", { ascending: false });

  // ONLY extract 1 cover file ID per property (max 16 IDs instead of 841)
  const coverFileByProperty = new Map<string, string>();
  for (const photo of photos || []) {
    if (!coverFileByProperty.has(photo.property_id) || photo.is_cover) {
      coverFileByProperty.set(photo.property_id, photo.file_id);
    }
  }

  const uniqueCoverFileIds = [...new Set(Array.from(coverFileByProperty.values()))];
  console.log(`Querying files table for ONLY ${uniqueCoverFileIds.length} cover file IDs (instead of 841)...`);

  const { data: files, error } = await supabase
    .from("files")
    .select("id, public_url, bucket, object_key")
    .in("id", uniqueCoverFileIds);

  if (error) {
    console.error("Files Query Error:", error);
    return;
  }

  const fileMap = new Map((files || []).map((f) => [f.id, f.public_url || `${DEFAULT_R2_PUBLIC_BASE_URL}/${f.bucket}/${f.object_key}`]));

  console.log(`\nActive Properties Count: ${properties?.length || 0}`);
  (properties || []).forEach((p, idx) => {
    const fileId = coverFileByProperty.get(p.id);
    const coverUrl = fileId ? fileMap.get(fileId) : null;
    if (!coverUrl) {
      console.log(`❌ [${idx + 1}] "${p.name}" ➔ COVER IS NULL`);
    } else {
      console.log(`✅ [${idx + 1}] "${p.name}" ➔ Cover URL: ${coverUrl}`);
    }
  });
}

main();
