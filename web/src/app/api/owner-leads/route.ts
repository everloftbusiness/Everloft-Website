import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { verifyCaptchaToken } from "@/lib/security/captcha";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  phone: z.string().trim().min(6).max(25),
  city: z.string().trim().min(2).max(100),
  propertyType: z.string().trim().min(2).max(100),
  message: z.string().trim().max(2000).optional(),
  captchaToken: z.string().optional(),
});

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit("owner_leads", clientIp, { windowMs: 60_000, maxRequests: 5 });
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
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const isCaptchaValid = await verifyCaptchaToken(parsed.data.captchaToken, {
    action: "owner_lead",
    request,
  });
  if (!isCaptchaValid) {
    return NextResponse.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 400 });
  }

  const lead = await prisma.ownerLead.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase().trim(),
      phone: parsed.data.phone.trim(),
      city: parsed.data.city,
      propertyType: parsed.data.propertyType,
      message: parsed.data.message,
    },
  });

  return NextResponse.json({ ok: true, id: lead.id });
}
