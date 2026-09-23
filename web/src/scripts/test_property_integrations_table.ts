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
  console.log("Checking if property_integrations table exists in Supabase...");
  const supabase = createClient(supabaseUrl, supabaseServiceKey!);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("property_integrations")
    .select("*")
    .limit(5);

  if (error) {
    console.log("Table property_integrations check error:", error.message);
  } else {
    console.log("SUCCESS! property_integrations table exists in Supabase. Count:", data?.length);
    console.log("Sample rows:", data);
  }
}

main();
