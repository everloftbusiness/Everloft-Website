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
