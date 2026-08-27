"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

const DEFAULT_SUPABASE_URL = "https://cvgrwujjaakqrxasixyf.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable__ko2FoXPD_u2kuiJrm4L9g_L_QRf1u9";

// One client per browser tab, reused across renders/components.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
  );
}
