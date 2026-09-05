import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cvgrwujjaakqrxasixyf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Z3J3dWpqYWFrcXJ4YXNpeHlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQxODk0NiwiZXhwIjoyMTAwOTk0OTQ2fQ.2eb1XRoBVX0kSqXjquuOdIH-6gmpTi3Dh5l9zaqCAIA";

async function main() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const testPropertyId = "a79e4cd8-2b76-4905-910b-f51db47d128b";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: blocks } = await (supabase as any)
    .from("property_availability_blocks")
    .select("*")
    .eq("property_id", testPropertyId)
    .is("deleted_at", null);

  console.log("Current active blocks in DB:", blocks);
}

main();
