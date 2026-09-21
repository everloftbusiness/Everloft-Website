import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRedirectPath, getCanonicalSiteUrl } from "@/lib/auth/url-helper";

// Every Supabase email link (invite, password reset, email change, future
// magic link / Google OAuth) redirects here with a `code` to exchange for a
// session. `next` controls where the user lands afterward.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const safeNext = sanitizeRedirectPath(rawNext, "/dashboard");
  const baseUrl = getCanonicalSiteUrl();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_failed`);
}
