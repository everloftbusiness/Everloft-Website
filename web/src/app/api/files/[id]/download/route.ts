import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDownloadUrl } from "@/lib/storage/file-service";

/** Redirects to a short-lived signed URL with Content-Disposition: attachment,
 * so a private file is never exposed as a permanent public link. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  try {
    const url = await getDownloadUrl(id);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
