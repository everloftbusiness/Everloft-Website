import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getFile, softDeleteFile, renameFile } from "@/lib/storage/file-service";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Get metadata for one file. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const file = await getFile(id);
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });
  return NextResponse.json({ file });
}

/** Soft delete — sets deleted_at, never removes the row or the R2 object. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  await softDeleteFile(id);
  return NextResponse.json({ ok: true });
}

const renameSchema = z.object({ originalName: z.string().min(1) });

/** Rename — updates the display name only, never the underlying object key. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  const parsed = renameSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "originalName is required." }, { status: 400 });

  const { id } = await params;
  await renameFile(id, parsed.data.originalName);
  return NextResponse.json({ ok: true });
}
