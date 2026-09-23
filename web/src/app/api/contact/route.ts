import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { verifyCaptchaToken } from "@/lib/security/captcha";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  phone: z.string().trim().max(25).optional(),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(5).max(2000),
  captchaToken: z.string().optional(),
});

async function forwardToGoogleSheet(data: z.infer<typeof schema>) {
  const scriptUrl = process.env.GOOGLE_CONTACT_SCRIPT_URL;
  if (!scriptUrl || !scriptUrl.trim()) return;

  const body = new URLSearchParams({
    name: data.name,
    email: data.email,
    contact_number: data.phone ?? "",
    message: `[${data.subject}] ${data.message}`,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    await fetch(scriptUrl, {
      method: "POST",
      headers: { Accept: "application/json" },
      body,
      signal: controller.signal,
    });
  } catch (error) {
    console.error("Failed to forward contact submission to Google Sheet:", error instanceof Error ? error.message : "Network error");
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit("contact_form", clientIp, { windowMs: 60_000, maxRequests: 5 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many contact submissions. Please wait a minute." },
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
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const isCaptchaValid = await verifyCaptchaToken(parsed.data.captchaToken, {
    action: "contact_form",
    request,
  });
  if (!isCaptchaValid) {
    return NextResponse.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 400 });
  }

  const message = await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      subject: parsed.data.subject,
      message: parsed.data.message,
    },
  });

  await forwardToGoogleSheet(parsed.data);
  return NextResponse.json({ ok: true, id: message.id });
}
