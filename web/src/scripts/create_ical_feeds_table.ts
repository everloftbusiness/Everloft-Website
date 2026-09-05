import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cvgrwujjaakqrxasixyf.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Z3J3dWpqYWFrcXJ4YXNpeHlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQxODk0NiwiZXhwIjoyMTAwOTk0OTQ2fQ.2eb1XRoBVX0kSqXjquuOdIH-6gmpTi3Dh5l9zaqCAIA";

async function main() {
  console.log("Attempting to create table property_ical_feeds in Supabase...");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS public.property_ical_feeds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
        channel_name TEXT NOT NULL,
        ical_url TEXT NOT NULL,
        sync_frequency_minutes INT DEFAULT 15,
        last_synced_at TIMESTAMPTZ,
        last_sync_status TEXT DEFAULT 'pending',
        last_error_message TEXT,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES auth.users(id),
        updated_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        deleted_at TIMESTAMPTZ
    );
  `;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("exec_sql", { sql: createTableSql });

  if (error) {
    console.log("RPC exec_sql error:", error);
  } else {
    console.log("SUCCESS creating table via rpc:", data);
  }
}

main();
