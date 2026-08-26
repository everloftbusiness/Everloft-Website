import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
  console.log("Attempting to alter constraint in Supabase...");

  // Execute raw SQL via RPC exec_sql if available, or test updating
  const { data, error } = await supabase.rpc("exec_sql", {
    query: `ALTER TABLE amenity_master DROP CONSTRAINT IF EXISTS amenity_master_category_check;`
  });

  if (error) {
    console.log("exec_sql RPC not available:", error.message);
  } else {
    console.log("Successfully dropped constraint!", data);
  }
}

main();
