import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { uploadFile, validateFileSize, computeChecksum, type Bucket } from "@/lib/storage/r2";
import { getFile, recordNewVersion } from "@/lib/storage/file-service";

/** Uploads a new version of an existing file. The previous version is kept
 * (archived, not deleted) so it can be restored — docs/STORAGE_ARCHITECTURE.md §11. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const previous = await getFile(id);
  if (!previous) return NextResponse.json({ error: "File not found." }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A replacement file is required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = previous.bucket as Bucket;

  try {
    validateFileSize(bucket, buffer.byteLength);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "File too large." }, { status: 413 });
  }

  const objectKey = `${user.id}/${randomUUID()}-${file.name}`;
  const checksum = computeChecksum(buffer);
  const uploaded = await uploadFile({
    bucket,
    key: objectKey,
    body: buffer,
    contentType: file.type || "application/octet-stream",
    makePublic: previous.is_public,
  });

  const newVersion = await recordNewVersion(id, {
    bucket,
    objectKey: uploaded.key,
    originalName: file.name,
    mimeType: uploaded.contentType,
    sizeBytes: uploaded.sizeBytes,
    checksum,
    thumbnailKey: uploaded.thumbnailKey,
    folderPath: previous.folder_path,
    isPublic: previous.is_public,
    publicUrl: uploaded.publicUrl,
    uploadedBy: user.id,
    metadata: uploaded.metadata,
    version: previous.version + 1,
  });

  return NextResponse.json({ file: newVersion });
}
