import "server-only";
import { createHash } from "crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";

// Cloudflare R2 is S3-API-compatible, so the AWS SDK works unmodified
// against R2's endpoint. Bucket names here must match the `files` table's
// `files_bucket_check` constraint (supabase/migrations/20260730000009_
// expand_files_table.sql). See docs/STORAGE_ARCHITECTURE.md §2 for why each
// bucket exists.
export const BUCKETS = {
  propertyImages: "property-images",
  propertyVideos: "property-videos",
  propertyDocuments: "property-documents",
  ownerDocuments: "owner-documents",
  investorDocuments: "investor-documents",
  guestDocuments: "guest-documents",
  maintenance: "maintenance",
  housekeeping: "housekeeping",
  agreements: "agreements",
  reports: "reports",
  invoices: "invoices",
  receipts: "receipts",
  utilityBills: "utility-bills",
  floorPlans: "floor-plans",
  avatars: "avatars",
  companyAssets: "company-assets",
  tempUploads: "temp-uploads",
  backups: "backups",
  aiGenerated: "ai-generated",
  reviewImages: "review-images",
} as const;

export type Bucket = (typeof BUCKETS)[keyof typeof BUCKETS];

// File size limits per docs/STORAGE_ARCHITECTURE.md §5 — enforced per
// bucket, not a single global limit, because a property video is
// legitimately ~100x larger than a receipt scan.
export const FILE_SIZE_LIMITS: Record<Bucket, number> = {
  [BUCKETS.avatars]: 5 * 1024 * 1024,
  [BUCKETS.propertyImages]: 25 * 1024 * 1024,
  [BUCKETS.floorPlans]: 50 * 1024 * 1024,
  [BUCKETS.propertyVideos]: 500 * 1024 * 1024,
  [BUCKETS.propertyDocuments]: 50 * 1024 * 1024,
  [BUCKETS.ownerDocuments]: 50 * 1024 * 1024,
  [BUCKETS.investorDocuments]: 50 * 1024 * 1024,
  [BUCKETS.agreements]: 50 * 1024 * 1024,
  [BUCKETS.reports]: 50 * 1024 * 1024,
  [BUCKETS.invoices]: 20 * 1024 * 1024,
  [BUCKETS.receipts]: 20 * 1024 * 1024,
  [BUCKETS.guestDocuments]: 20 * 1024 * 1024,
  [BUCKETS.maintenance]: 20 * 1024 * 1024,
  [BUCKETS.housekeeping]: 20 * 1024 * 1024,
  [BUCKETS.utilityBills]: 20 * 1024 * 1024,
  [BUCKETS.companyAssets]: 25 * 1024 * 1024,
  [BUCKETS.tempUploads]: 500 * 1024 * 1024, // matches the largest thing that might stage through it
  [BUCKETS.backups]: 500 * 1024 * 1024,
  [BUCKETS.aiGenerated]: 25 * 1024 * 1024,
  [BUCKETS.reviewImages]: 25 * 1024 * 1024,
};

const IMAGE_BUCKETS = new Set<Bucket>([
  BUCKETS.propertyImages,
  BUCKETS.reviewImages,
  BUCKETS.avatars,
  BUCKETS.aiGenerated,
]);

const RESPONSIVE_WIDTHS = { small: 400, medium: 800, large: 1600, xl4k: 3840 } as const;
export type ResponsiveSize = keyof typeof RESPONSIVE_WIDTHS;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function r2Client() {
  const accountId = requiredEnv("R2_ACCOUNT_ID");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export function validateFileSize(bucket: Bucket, sizeBytes: number) {
  const limit = FILE_SIZE_LIMITS[bucket];
  if (sizeBytes > limit) {
    throw new Error(`File exceeds the ${Math.round(limit / (1024 * 1024))}MB limit for ${bucket}.`);
  }
}

// Two supported topologies, chosen purely by which env var is set:
//   - R2_BUCKET_NAME set   -> single shared physical bucket, logical bucket
//                             (property-images, avatars, ...) becomes a key
//                             prefix instead of a real Cloudflare bucket.
//   - R2_BUCKET_NAME unset -> one real Cloudflare bucket per logical bucket
//                             (docs/STORAGE_ARCHITECTURE.md §2's original design).
// The `files` table's `bucket` column always stores the LOGICAL name either
// way — this switch is purely about how r2.ts maps that to a real S3
// Bucket+Key pair, so nothing above this layer (file-service.ts, the API
// routes, the schema) needs to know or care which topology is active.
function resolvePhysicalLocation(bucket: Bucket, key: string): { physicalBucket: string; physicalKey: string } {
  const sharedBucket = process.env.R2_BUCKET_NAME;
  if (sharedBucket) {
    return { physicalBucket: sharedBucket, physicalKey: `${bucket}/${key}` };
  }
  return { physicalBucket: bucket, physicalKey: key };
}

export function computeChecksum(body: Buffer): string {
  return createHash("sha256").update(body).digest("hex");
}

// Images get converted to WebP and compressed before upload. Sharp does not
// preserve EXIF/GPS metadata unless `.withMetadata()` is explicitly called —
// deliberately never called here, so every processed image is stripped of
// camera/GPS metadata by default (privacy — a guest ID photo or a property
// exterior shot should never leak the uploader's GPS coordinates downstream).
async function toWebp(body: Buffer, width?: number) {
  let pipeline = sharp(body).rotate(); // .rotate() bakes in EXIF orientation, then metadata is dropped
  if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });
  return pipeline.webp({ quality: 82 }).toBuffer();
}

async function readImageMetadata(body: Buffer) {
  const meta = await sharp(body).metadata();
  return { width: meta.width ?? null, height: meta.height ?? null, format: meta.format ?? null };
}

async function putObject(bucket: Bucket, key: string, body: Buffer, contentType: string) {
  const client = r2Client();
  const { physicalBucket, physicalKey } = resolvePhysicalLocation(bucket, key);
  await client.send(new PutObjectCommand({ Bucket: physicalBucket, Key: physicalKey, Body: body, ContentType: contentType }));
}

export type UploadResult = {
  bucket: Bucket;
  key: string;
  sizeBytes: number;
  contentType: string;
  checksum: string;
  publicUrl: string | null;
  thumbnailKey: string | null;
  metadata: Record<string, unknown>;
};

/**
 * Uploads the original file, and — for image buckets — additionally
 * generates a WebP-converted primary copy, a thumbnail, and the responsive
 * size set. The *original* is always kept untouched alongside the derived
 * copies (never overwritten), per docs/STORAGE_ARCHITECTURE.md §7
 * ("keep original copy").
 */
export async function uploadFile(params: {
  bucket: Bucket;
  key: string; // key for the ORIGINAL file
  body: Buffer;
  contentType: string;
  makePublic?: boolean;
  generateDerivatives?: boolean; // thumbnail + responsive sizes; images only
}): Promise<UploadResult> {
  validateFileSize(params.bucket, params.body.byteLength);
  const checksum = computeChecksum(params.body);

  await putObject(params.bucket, params.key, params.body, params.contentType);

  let thumbnailKey: string | null = null;
  let metadata: Record<string, unknown> = {};

  const isImage = IMAGE_BUCKETS.has(params.bucket) && params.contentType.startsWith("image/");
  if (isImage) {
    metadata = await readImageMetadata(params.body);

    if (params.generateDerivatives !== false) {
      const keyWithoutExt = params.key.replace(/\.[^./]+$/, "");
      thumbnailKey = `${keyWithoutExt}__thumb.webp`;
      const thumbBuffer = await toWebp(params.body, RESPONSIVE_WIDTHS.small);
      await putObject(params.bucket, thumbnailKey, thumbBuffer, "image/webp");

      // Responsive sizes beyond the thumbnail — generated best-effort,
      // skipped for images already smaller than a given breakpoint.
      for (const [size, width] of Object.entries(RESPONSIVE_WIDTHS) as [ResponsiveSize, number][]) {
        if (size === "small") continue; // that's the thumbnail, already done
        if (typeof metadata.width === "number" && metadata.width <= width) continue;
        const resized = await toWebp(params.body, width);
        await putObject(params.bucket, `${keyWithoutExt}__${size}.webp`, resized, "image/webp");
      }
    }
  }

  return {
    bucket: params.bucket,
    key: params.key,
    sizeBytes: params.body.byteLength,
    contentType: isImage ? "image/webp" : params.contentType,
    checksum,
    thumbnailKey,
    metadata,
    // A missing R2_PUBLIC_BASE_URL (no custom domain attached to the
    // bucket yet) must never fail the upload itself — the object is safely
    // stored either way; it's just not reachable via a permanent public URL
    // until that's configured. Callers fall back to signed URLs
    // (getSignedDownloadUrl) in the meantime.
    publicUrl: params.makePublic ? tryGetPublicUrl(params.bucket, params.key) : null,
  };
}

// Only meaningful if the bucket has a Cloudflare public-access domain/custom
// domain attached — set R2_PUBLIC_BASE_URL once that's configured.
export function getPublicUrl(bucket: Bucket, key: string): string {
  const base = requiredEnv("R2_PUBLIC_BASE_URL");
  return `${base.replace(/\/$/, "")}/${bucket}/${key}`;
}

function tryGetPublicUrl(bucket: Bucket, key: string): string | null {
  try {
    return getPublicUrl(bucket, key);
  } catch {
    return null;
  }
}

export async function getSignedDownloadUrl(
  bucket: Bucket,
  key: string,
  options?: { expiresInSeconds?: number; downloadFileName?: string }
): Promise<string> {
  const client = r2Client();
  const { physicalBucket, physicalKey } = resolvePhysicalLocation(bucket, key);
  const command = new GetObjectCommand({
    Bucket: physicalBucket,
    Key: physicalKey,
    ResponseContentDisposition: options?.downloadFileName
      ? `attachment; filename="${options.downloadFileName}"`
      : undefined,
  });
  return getSignedUrl(client, command, { expiresIn: options?.expiresInSeconds ?? 3600 });
}

export async function copyObject(sourceBucket: Bucket, sourceKey: string, destBucket: Bucket, destKey: string) {
  const client = r2Client();
  const source = resolvePhysicalLocation(sourceBucket, sourceKey);
  const dest = resolvePhysicalLocation(destBucket, destKey);
  await client.send(
    new CopyObjectCommand({
      Bucket: dest.physicalBucket,
      Key: dest.physicalKey,
      CopySource: `${source.physicalBucket}/${encodeURIComponent(source.physicalKey)}`,
    })
  );
}

// Removes the object from R2 — the underlying binary blob. The `files`
// metadata row is still soft-deleted (deleted_at) separately, never
// hard-deleted, per the platform-wide "never permanently delete records"
// rule. This function is for the rare "permanent delete" lifecycle action
// (docs/STORAGE_ARCHITECTURE.md §10), not the default delete path.
export async function deleteObject(bucket: Bucket, key: string) {
  const client = r2Client();
  const { physicalBucket, physicalKey } = resolvePhysicalLocation(bucket, key);
  await client.send(new DeleteObjectCommand({ Bucket: physicalBucket, Key: physicalKey }));
}
