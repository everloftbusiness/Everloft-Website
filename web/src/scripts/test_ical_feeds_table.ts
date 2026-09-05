import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cvgrwujjaakqrxasixyf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Z3J3dWpqYWFrcXJ4YXNpeHlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQxODk0NiwiZXhwIjoyMTAwOTk0OTQ2fQ.2eb1XRoBVX0kSqXjquuOdIH-6gmpTi3Dh5l9zaqCAIA";

async function main() {
  console.log("Checking if property_ical_feeds table exists in Supabase...");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("property_ical_feeds")
    .select("*")
    .limit(1);

  if (error) {
    console.log("Table check error:", error.message, error.code);
  } else {
    console.log("Table property_ical_feeds exists! Sample rows:", data?.length);
  }
}

main();
