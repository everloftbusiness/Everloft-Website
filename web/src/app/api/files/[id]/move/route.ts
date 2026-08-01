import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { moveFile } from "@/lib/storage/file-service";

const moveSchema = z.object({ ownerType: z.string().min(1), ownerId: z.string().min(1), folderPath: z.string().optional() });

/** Re-points a file to a different owner/folder. Metadata-only — the R2
 * object's key is never derived from ownership, so nothing moves in storage. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  const parsed = moveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ownerType and ownerId are required." }, { status: 400 });

  const { id } = await params;
  await moveFile(id, parsed.data);
  return NextResponse.json({ ok: true });
}
