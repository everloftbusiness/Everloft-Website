import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: photos, error } = await supabase.from("property_photos").select("id, property_id, file_id, deleted_at, is_cover").limit(10);
  console.log("PROPERTY_PHOTOS ROWS:", error || photos);
}

main();
