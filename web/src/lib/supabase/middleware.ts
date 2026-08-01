import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Called from proxy.ts on every request. Refreshes the Supabase session
// cookie (access tokens expire hourly) and returns both the possibly-new
// response and the authenticated user, so callers don't have to re-fetch it.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // IMPORTANT: getUser() (not getSession()) re-validates the token against
  // Supabase Auth rather than trusting the cookie's claims as-is.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
