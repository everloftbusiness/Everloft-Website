import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("Testing properties query with Service Role Key vs Anon Key...");

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);
  const { data: adminProps, error: adminErr } = await adminClient
    .from("properties")
    .select("id, name, status_id, owner_id, managed_by")
    .is("deleted_at", null)
    .limit(5);

  console.log("Admin Client Query (Service Role):", adminErr ? `ERROR: ${adminErr.message}` : `SUCCESS (${adminProps?.length} items)`);

  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: anonProps, error: anonErr } = await anonClient
    .from("properties")
    .select("id, name, status_id, owner_id, managed_by")
    .is("deleted_at", null)
    .limit(5);

  console.log("Anon Client Query (Anon Key):", anonErr ? `ERROR: ${anonErr.message}` : `SUCCESS (${anonProps?.length} items)`);
}

main();
