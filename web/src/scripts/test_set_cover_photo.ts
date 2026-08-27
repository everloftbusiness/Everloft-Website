import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("Testing primary cover photo setting...");

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: prop } = await supabase.from("properties").select("id, name, slug").eq("slug", "stylish-3bhk-in-electronic-city-balcony-views-7").single();
  if (!prop) return;

  const { data: photos } = await supabase.from("property_photos").select("id, file_id, is_cover").eq("property_id", prop.id).is("deleted_at", null).order("sort_order");
  if (!photos?.length) return;

  console.log(`Property: "${prop.name}" has ${photos.length} photos.`);
  console.log(`Current cover photo ID: ${photos.find((p) => p.is_cover)?.id || "None"}`);

  // Set photo #3 as primary cover
  const targetPhoto = photos[2];
  console.log(`Setting Photo #3 (${targetPhoto.id}) as primary cover...`);

  await supabase.from("property_photos").update({ is_cover: false }).eq("property_id", prop.id);
  await supabase.from("property_photos").update({ is_cover: true }).eq("id", targetPhoto.id);

  const { data: updatedPhotos } = await supabase.from("property_photos").select("id, file_id, is_cover").eq("property_id", prop.id).is("deleted_at", null);
  const newCover = updatedPhotos?.find((p) => p.is_cover);

  console.log(`🎉 New Primary Cover Photo ID: ${newCover?.id} (File ID: ${newCover?.file_id})`);
}

main();
