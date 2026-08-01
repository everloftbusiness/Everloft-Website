import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { copyFile } from "@/lib/storage/file-service";

const copySchema = z.object({ ownerType: z.string().optional(), ownerId: z.string().optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = copySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const { id } = await params;
  const copied = await copyFile(id, { ...parsed.data, uploadedBy: user.id });
  return NextResponse.json({ file: copied });
}
