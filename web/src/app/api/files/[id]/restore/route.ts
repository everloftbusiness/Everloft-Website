import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { restoreFile } from "@/lib/storage/file-service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  await restoreFile(id);
  return NextResponse.json({ ok: true });
}
