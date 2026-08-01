import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listFiles } from "@/lib/storage/file-service";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const result = await listFiles({
    bucket: searchParams.get("bucket") ?? undefined,
    ownerType: searchParams.get("ownerType") ?? undefined,
    ownerId: searchParams.get("ownerId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    status: (searchParams.get("status") as "active" | "processing" | "failed" | "archived") ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
    pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
  });

  return NextResponse.json(result);
}
