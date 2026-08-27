import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const DEFAULT_R2_PUBLIC_BASE_URL = "https://pub-ceafc7e3144f4cf0be1a828c0ec9f85c.r2.dev";

async function main() {
  console.log("Checking photo files public_url in Supabase...");

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: activeStatus } = await supabase.from("property_status").select("id").eq("slug", "active").single();
  const { data: properties } = await supabase.from("properties").select("id, name, slug").eq("status_id", activeStatus?.id).is("deleted_at", null);
  const propertyIds = (properties || []).map((p) => p.id);

  const { data: photos } = await supabase.from("property_photos").select("property_id, file_id, is_cover").in("property_id", propertyIds).is("deleted_at", null).order("is_cover", { ascending: false });
  const fileIds = (photos || []).map((ph) => ph.file_id);

  const { data: files } = await supabase.from("files").select("id, public_url, bucket, object_key").in("id", fileIds);

  console.log(`\nFound ${files?.length || 0} files in active properties database.`);
  (files || []).slice(0, 5).forEach((f) => {
    const publicBase = process.env.R2_PUBLIC_BASE_URL || DEFAULT_R2_PUBLIC_BASE_URL;
    const computedUrl = f.public_url || `${publicBase.replace(/\/$/, "")}/${f.bucket}/${f.object_key}`;
    console.log(`  • File ID: ${f.id}`);
    console.log(`    - stored public_url: ${f.public_url}`);
    console.log(`    - computed url: ${computedUrl}`);
  });
}

main();
