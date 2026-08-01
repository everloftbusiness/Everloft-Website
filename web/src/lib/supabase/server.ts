import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

// Server Components / Route Handlers / Server Actions client. Reads the
// session from cookies; RLS is enforced using the requesting user's JWT
// (this client is never given the service-role key).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component with no response to attach
            // cookies to — safe to ignore as long as proxy.ts refreshes
            // the session on every navigation (it does).
          }
        },
      },
    }
  );
}
