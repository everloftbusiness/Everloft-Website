import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("Testing exact columns in Supabase properties table...");

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("properties")
    .select("id, name, slug, internal_code, city, type_id, status_id, owner_id, managed_by, max_guests")
    .is("deleted_at", null)
    .limit(1);

  console.log("Query Result:", error ? `ERROR: ${JSON.stringify(error)}` : `SUCCESS: ${data?.length} row(s)`);
}

main();
