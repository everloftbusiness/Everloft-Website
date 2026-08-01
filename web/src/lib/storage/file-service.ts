import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSignedDownloadUrl, getPublicUrl, copyObject, type Bucket } from "@/lib/storage/r2";

// This is the "service layer" for the `files` table specifically — the
// only place in the app that reads/writes file *metadata* rows. Actual
// object storage operations live in lib/storage/r2.ts; this file owns the
// database side and the business rules around versioning/lifecycle. Kept
// in lib/storage (not features/) because it's cross-cutting infrastructure
// every future feature (properties, maintenance, invoices, ...) depends on,
// per docs/ARCHITECTURE.md §3's folder-purpose table.

export type FileRow = {
  id: string;
  bucket: string;
  object_key: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  public_url: string | null;
  is_public: boolean;
  owner_type: string | null;
  owner_id: string | null;
  uploaded_by: string | null;
  folder_path: string | null;
  extension: string | null;
  checksum: string | null;
  thumbnail_key: string | null;
  status: "active" | "processing" | "failed" | "archived";
  metadata: Record<string, unknown>;
  version: number;
  previous_version_id: string | null;
  created_at: string;
  deleted_at: string | null;
};

export type ListFilesFilters = {
  bucket?: string;
  ownerType?: string;
  ownerId?: string;
  search?: string; // matches original_name
  status?: FileRow["status"];
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
};

export async function listFiles(filters: ListFilesFilters) {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;

  let query = supabase.from("files").select("*", { count: "exact" });
  if (!filters.includeDeleted) query = query.is("deleted_at", null);
  if (filters.bucket) query = query.eq("bucket", filters.bucket);
  if (filters.ownerType) query = query.eq("owner_type", filters.ownerType);
  if (filters.ownerId) query = query.eq("owner_id", filters.ownerId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.search) query = query.ilike("original_name", `%${filters.search}%`);

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw error;
  return { files: (data ?? []) as FileRow[], total: count ?? 0, page, pageSize };
}

export async function getFile(id: string): Promise<FileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("files").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as FileRow | null;
}

export async function createFileRecord(input: {
  bucket: Bucket;
  objectKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  thumbnailKey: string | null;
  folderPath: string | null;
  isPublic: boolean;
  publicUrl: string | null;
  ownerType: string | null;
  ownerId: string | null;
  uploadedBy: string;
  metadata: Record<string, unknown>;
}): Promise<FileRow> {
  const supabase = await createClient();
  const extension = input.originalName.includes(".") ? input.originalName.split(".").pop()! : null;

  const { data, error } = await supabase
    .from("files")
    .insert({
      bucket: input.bucket,
      object_key: input.objectKey,
      original_name: input.originalName,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      checksum: input.checksum,
      thumbnail_key: input.thumbnailKey,
      folder_path: input.folderPath,
      extension,
      is_public: input.isPublic,
      public_url: input.publicUrl,
      owner_type: input.ownerType,
      owner_id: input.ownerId,
      uploaded_by: input.uploadedBy,
      metadata: input.metadata,
      status: "active",
    })
    .select()
    .single();

  if (error) throw error;
  return data as FileRow;
}

/** Soft delete — sets deleted_at. Never removes the row or the R2 object. */
export async function softDeleteFile(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("files").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function restoreFile(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("files").update({ deleted_at: null }).eq("id", id);
  if (error) throw error;
}

/** Archive — a deliberate lifecycle state distinct from soft delete (§10: "Archive" is
 * reversible visibility, not a deletion signal). */
export async function archiveFile(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("files").update({ status: "archived" }).eq("id", id);
  if (error) throw error;
}

/**
 * Records a new version row (new object already uploaded to R2 under a new
 * key by the caller) and marks the previous current version `archived` —
 * never overwrites or deletes the old object, so "restore previous version"
 * is always possible (docs/STORAGE_ARCHITECTURE.md §11).
 */
export async function recordNewVersion(
  previousId: string,
  newFile: Omit<Parameters<typeof createFileRecord>[0], "ownerType" | "ownerId"> & { version: number }
): Promise<FileRow> {
  const supabase = await createClient();
  const previous = await getFile(previousId);
  if (!previous) throw new Error("Previous file version not found.");

  const { data, error } = await supabase
    .from("files")
    .insert({
      bucket: newFile.bucket,
      object_key: newFile.objectKey,
      original_name: newFile.originalName,
      mime_type: newFile.mimeType,
      size_bytes: newFile.sizeBytes,
      checksum: newFile.checksum,
      thumbnail_key: newFile.thumbnailKey,
      folder_path: newFile.folderPath,
      extension: newFile.originalName.includes(".") ? newFile.originalName.split(".").pop()! : null,
      is_public: newFile.isPublic,
      public_url: newFile.publicUrl,
      owner_type: previous.owner_type,
      owner_id: previous.owner_id,
      uploaded_by: newFile.uploadedBy,
      metadata: newFile.metadata,
      status: "active",
      version: newFile.version,
      previous_version_id: previousId,
    })
    .select()
    .single();
  if (error) throw error;

  await archiveFile(previousId);
  return data as FileRow;
}

/** Reactivates an older version as current, archiving whatever was active in its place. */
export async function restoreVersion(versionId: string): Promise<void> {
  const supabase = await createClient();
  const version = await getFile(versionId);
  if (!version) throw new Error("Version not found.");

  // Find whichever row in this version chain is currently active and archive it.
  const { data: siblings, error: siblingErr } = await supabase
    .from("files")
    .select("id")
    .eq("owner_type", version.owner_type ?? "")
    .eq("owner_id", version.owner_id ?? "")
    .eq("status", "active")
    .neq("id", versionId);
  if (siblingErr) throw siblingErr;
  for (const sibling of siblings ?? []) await archiveFile(sibling.id);

  const { error } = await supabase.from("files").update({ status: "active", deleted_at: null }).eq("id", versionId);
  if (error) throw error;
}

/** Moves a file to a different owner/folder — metadata-only; the R2 object's
 * key never changes (it isn't derived from ownership), so no storage
 * operation is needed, just re-pointing the row. */
export async function moveFile(id: string, target: { ownerType: string; ownerId: string; folderPath?: string }) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("files")
    .update({ owner_type: target.ownerType, owner_id: target.ownerId, folder_path: target.folderPath ?? null })
    .eq("id", id);
  if (error) throw error;
}

export async function renameFile(id: string, newOriginalName: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("files").update({ original_name: newOriginalName }).eq("id", id);
  if (error) throw error;
}

/** Copies both the R2 object and the metadata row — an independent new
 * asset, not a version (no previous_version_id link). */
export async function copyFile(
  id: string,
  target: { ownerType?: string; ownerId?: string; uploadedBy: string }
): Promise<FileRow> {
  const source = await getFile(id);
  if (!source) throw new Error("File not found.");

  const newKey = `${source.object_key}__copy-${Date.now()}`;
  await copyObject(source.bucket as Bucket, source.object_key, source.bucket as Bucket, newKey);

  return createFileRecord({
    bucket: source.bucket as Bucket,
    objectKey: newKey,
    originalName: source.original_name,
    mimeType: source.mime_type,
    sizeBytes: source.size_bytes,
    checksum: source.checksum ?? "",
    thumbnailKey: null,
    folderPath: source.folder_path,
    isPublic: source.is_public,
    publicUrl: source.is_public ? getPublicUrl(source.bucket as Bucket, newKey) : null,
    ownerType: target.ownerType ?? source.owner_type,
    ownerId: target.ownerId ?? source.owner_id,
    uploadedBy: target.uploadedBy,
    metadata: source.metadata,
  });
}

export async function getDownloadUrl(id: string): Promise<string> {
  const file = await getFile(id);
  if (!file) throw new Error("File not found.");
  return getSignedDownloadUrl(file.bucket as Bucket, file.object_key, { downloadFileName: file.original_name });
}

export async function getViewUrl(id: string, expiresInSeconds = 3600): Promise<string> {
  const file = await getFile(id);
  if (!file) throw new Error("File not found.");
  return getSignedDownloadUrl(file.bucket as Bucket, file.object_key, { expiresInSeconds });
}

export function getPublicFileUrl(file: FileRow): string {
  if (!file.is_public) throw new Error("File is not public.");
  return file.public_url ?? getPublicUrl(file.bucket as Bucket, file.object_key);
}
