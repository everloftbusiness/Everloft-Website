import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const fileId = "8b94dbb4-dbbb-4a1d-80fe-0f0a05be29bb";
  const { data: file, error } = await supabase.from("files").select("*").eq("id", fileId).single();

  console.log("FILE RECORD FROM DATABASE:", error || file);
}

main();
