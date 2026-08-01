import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { uploadFile, validateFileSize, computeChecksum, BUCKETS, type Bucket } from "@/lib/storage/r2";
import { createFileRecord } from "@/lib/storage/file-service";

const VALID_BUCKETS = new Set<string>(Object.values(BUCKETS));

// Generic upload endpoint: any authenticated user can upload, but the
// `files` row is inserted with uploaded_by = themselves, so RLS
// (files_insert_own) and every downstream read policy scope access
// correctly regardless of what this route allows through.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const bucket = formData.get("bucket");
  const ownerType = formData.get("ownerType");
  const ownerId = formData.get("ownerId");
  const folderPath = formData.get("folderPath");
  const isPublic = formData.get("isPublic") === "true";

  if (!(file instanceof File) || typeof bucket !== "string" || !VALID_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "A file and a valid bucket are required." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    validateFileSize(bucket as Bucket, buffer.byteLength);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "File too large." }, { status: 413 });
  }

  const objectKey = `${user.id}/${randomUUID()}-${file.name}`;
  const checksum = computeChecksum(buffer);

  const uploaded = await uploadFile({
    bucket: bucket as Bucket,
    key: objectKey,
    body: buffer,
    contentType: file.type || "application/octet-stream",
    makePublic: isPublic,
  });

  const row = await createFileRecord({
    bucket: uploaded.bucket,
    objectKey: uploaded.key,
    originalName: file.name,
    mimeType: uploaded.contentType,
    sizeBytes: uploaded.sizeBytes,
    checksum,
    thumbnailKey: uploaded.thumbnailKey,
    folderPath: typeof folderPath === "string" ? folderPath : null,
    isPublic,
    publicUrl: uploaded.publicUrl,
    ownerType: typeof ownerType === "string" ? ownerType : null,
    ownerId: typeof ownerId === "string" ? ownerId : null,
    uploadedBy: user.id,
    metadata: uploaded.metadata,
  });

  return NextResponse.json({ file: row });
}
