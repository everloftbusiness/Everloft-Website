import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Service-role / Secret-key client — bypasses RLS entirely. Import ONLY from trusted
// server code (route handlers, server actions, cron/webhook handlers) that
// has already established WHY the operation is allowed. Never expose this
// key to the browser.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!supabaseUrl || !supabaseUrl.trim()) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL is missing. Privileged admin operations are unavailable in this environment."
    );
  }

  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey || !secretKey.trim()) {
    throw new Error(
      "SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY is missing. Privileged admin operations are unavailable in this environment."
    );
  }

  return createSupabaseClient<Database>(
    supabaseUrl.trim(),
    secretKey.trim(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
