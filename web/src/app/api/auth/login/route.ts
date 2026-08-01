import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }
  const { email, password, rememberMe } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // Supabase's cookie adapter always sets a persistent (long-lived) session
  // cookie. If the user didn't check "Remember me", downgrade it to a
  // session cookie (no maxAge) so it clears when the browser closes.
  if (!rememberMe) {
    const cookieStore = await cookies();
    for (const cookie of cookieStore.getAll()) {
      if (cookie.name.startsWith("sb-")) {
        cookieStore.set(cookie.name, cookie.value, { path: "/", sameSite: "lax" });
      }
    }
  }

  const name = (data.user.user_metadata?.full_name as string | undefined) ?? data.user.email ?? "there";
  return NextResponse.json({ ok: true, name });
}
