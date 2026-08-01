import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFile, getPublicFileUrl } from "@/lib/storage/file-service";

/** Returns the permanent public URL — only for files explicitly marked
 * is_public (property listing photos, company assets). Private files
 * (agreements, guest IDs, invoices, ...) always 403 here — use /signed-url
 * instead, per docs/STORAGE_ARCHITECTURE.md §8. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const file = await getFile(id);
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });
  if (!file.is_public) {
    return NextResponse.json({ error: "This file is private. Use /signed-url instead." }, { status: 403 });
  }

  return NextResponse.json({ url: getPublicFileUrl(file) });
}
