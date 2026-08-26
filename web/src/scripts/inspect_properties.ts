import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
  const { data: props } = await supabase.from("properties").select("id, name, slug, description, check_in_time, check_out_time, created_at").is("deleted_at", null).order("created_at", { ascending: false });

  console.log(`Found ${props?.length || 0} total properties in database:`);
  (props || []).forEach(p => {
    console.log(`\nID: ${p.id}`);
    console.log(`Name: ${p.name}`);
    console.log(`Slug: ${p.slug}`);
    console.log(`Check-in: ${p.check_in_time}, Check-out: ${p.check_out_time}`);
    console.log(`Desc Length: ${p.description?.length || 0}`);
    console.log(`Desc Snippet: ${p.description?.slice(0, 100)}...`);
  });
}

main();
