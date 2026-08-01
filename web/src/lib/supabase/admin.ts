import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Service-role client — bypasses RLS entirely. Import ONLY from trusted
// server code (route handlers, server actions, cron/webhook handlers) that
// has already established WHY the operation is allowed. Never expose this
// key to the browser (it is not prefixed NEXT_PUBLIC_ for that reason).
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
