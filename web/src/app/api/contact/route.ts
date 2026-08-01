import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(2),
  message: z.string().min(5),
});

async function forwardToGoogleSheet(data: z.infer<typeof schema>) {
  const scriptUrl = process.env.GOOGLE_CONTACT_SCRIPT_URL;
  if (!scriptUrl) return;

  const body = new URLSearchParams({
    name: data.name,
    email: data.email,
    contact_number: data.phone ?? "",
    message: `[${data.subject}] ${data.message}`,
  });

  try {
    await fetch(scriptUrl, {
      method: "POST",
      headers: { Accept: "application/json" },
      body,
    });
  } catch (error) {
    console.error("Failed to forward contact submission to Google Sheet:", error);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const message = await prisma.contactMessage.create({ data: parsed.data });
  await forwardToGoogleSheet(parsed.data);
  return NextResponse.json({ id: message.id });
}
