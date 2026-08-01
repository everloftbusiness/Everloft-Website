import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getViewUrl } from "@/lib/storage/file-service";

/** Returns a short-lived signed URL for inline viewing (no attachment
 * header) — the only way private buckets are ever accessed by the client,
 * per docs/STORAGE_ARCHITECTURE.md §8. Never returns a permanent URL. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const expiresIn = searchParams.get("expiresIn") ? Number(searchParams.get("expiresIn")) : undefined;

  const { id } = await params;
  try {
    const url = await getViewUrl(id, expiresIn);
    return NextResponse.json({ url, expiresIn: expiresIn ?? 3600 });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
