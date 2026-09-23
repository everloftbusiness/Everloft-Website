import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const schema = z.object({
  email: z.string().trim().email().max(150),
  password: z.string().min(1).max(200),
  rememberMe: z.boolean().optional().default(false),
  captchaToken: z.string().optional(),
});

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit("auth_login", clientIp, { windowMs: 60_000, maxRequests: 5 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a minute before trying again." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }
  const { email, password, rememberMe } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!rememberMe) {
    const cookieStore = await cookies();
    for (const cookie of cookieStore.getAll()) {
      if (cookie.name.startsWith("sb-")) {
        cookieStore.set(cookie.name, cookie.value, { path: "/", sameSite: "lax" });
      }
    }
  }

  const name = (data.user.user_metadata?.full_name as string | undefined) ?? "there";
  return NextResponse.json({ ok: true, name });
}
