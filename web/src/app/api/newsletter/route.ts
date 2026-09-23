import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { verifyCaptchaToken } from "@/lib/security/captcha";

const schema = z.object({
  email: z.string().trim().email().max(150),
  captchaToken: z.string().optional(),
});

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit("newsletter_sub", clientIp, { windowMs: 60_000, maxRequests: 5 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute." },
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
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const isCaptchaValid = await verifyCaptchaToken(parsed.data.captchaToken, {
    action: "newsletter_subscribe",
    request,
  });
  if (!isCaptchaValid) {
    return NextResponse.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 400 });
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();

  await prisma.newsletterSubscriber.upsert({
    where: { email: normalizedEmail },
    update: {},
    create: { email: normalizedEmail },
  });

  return NextResponse.json({ ok: true });
}
