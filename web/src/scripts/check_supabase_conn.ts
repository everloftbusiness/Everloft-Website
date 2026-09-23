import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cvgrwujjaakqrxasixyf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SECRET_KEY is required to run script.");
}

async function main() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey!);

  // Check if we can insert into an existing table or check database connection
  const { data, error } = await supabase.from("properties").select("id").limit(1);
  console.log("Supabase connection check:", error ? error.message : `OK, ${data?.length} property`);
}

main();
