import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Every Supabase email link (invite, password reset, email change, future
// magic link / Google OAuth) redirects here with a `code` to exchange for a
// session. `next` controls where the user lands afterward.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
