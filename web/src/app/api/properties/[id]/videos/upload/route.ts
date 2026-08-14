import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSession } from "@/lib/dashboard/session";
import { uploadFile, computeChecksum, BUCKETS } from "@/lib/storage/r2";
import { createFileRecord } from "@/lib/storage/file-service";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large video uploads

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: propertyId } = await params;

  try {
    const session = await getDashboardSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    if (!session.permissions.includes("edit_property") && !session.permissions.includes("manage_properties")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    let fileBuffer: Buffer;
    let fileName: string = "property-video.mp4";
    let contentType: string = "video/mp4";
    let videoType: string = "walkthrough";
    let caption: string | null = null;

    const reqContentType = request.headers.get("content-type") || "";

    // 1. Direct Binary Streaming (Recommended for large files > 10MB to avoid FormData parser crashes)
    if (
      reqContentType.startsWith("video/") ||
      reqContentType.startsWith("application/octet-stream") ||
      request.headers.get("x-file-name")
    ) {
      const arrayBuffer = await request.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);

      const rawFileName = request.headers.get("x-file-name");
      if (rawFileName) {
        try {
          fileName = decodeURIComponent(rawFileName);
        } catch {
          fileName = rawFileName;
        }
      }

      contentType = request.headers.get("x-file-type") || reqContentType || "video/mp4";
      videoType = request.headers.get("x-video-type") || "walkthrough";

      const rawCaption = request.headers.get("x-caption");
      if (rawCaption) {
        try {
          caption = decodeURIComponent(rawCaption);
        } catch {
          caption = rawCaption;
        }
      }
    } else {
      // 2. Multipart FormData fallback
      try {
        const formData = await request.formData();
        const file = formData.get("file");
        videoType = (formData.get("videoType") as string) || "walkthrough";
        caption = (formData.get("caption") as string) || null;

        if (file instanceof File) {
          fileName = file.name;
          contentType = file.type || "video/mp4";
          fileBuffer = Buffer.from(await file.arrayBuffer());
        } else {
          return NextResponse.json({ error: "A video file is required." }, { status: 400 });
        }
      } catch (err) {
        // If formData parsing fails, attempt fallback to raw stream
        const arrayBuffer = await request.arrayBuffer();
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          return NextResponse.json({ error: "Empty or invalid video payload." }, { status: 400 });
        }
        fileBuffer = Buffer.from(arrayBuffer);
        const rawFileName = request.headers.get("x-file-name");
        fileName = rawFileName ? decodeURIComponent(rawFileName) : "video.mp4";
        contentType = request.headers.get("x-file-type") || "video/mp4";
        videoType = request.headers.get("x-video-type") || "walkthrough";
        const rawCaption = request.headers.get("x-caption");
        caption = rawCaption ? decodeURIComponent(rawCaption) : null;
      }
    }

    if (!fileBuffer || fileBuffer.byteLength === 0) {
      return NextResponse.json({ error: "No video data received." }, { status: 400 });
    }

    if (fileBuffer.byteLength > 500 * 1024 * 1024) {
      return NextResponse.json({ error: "Video exceeds 500MB size limit." }, { status: 413 });
    }

    const objectKey = `${session.userId}/${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const checksum = computeChecksum(fileBuffer);

    const uploaded = await uploadFile({
      bucket: BUCKETS.propertyVideos,
      key: objectKey,
      body: fileBuffer,
      contentType: contentType || "video/mp4",
      makePublic: true,
      generateDerivatives: false,
    });

    const fileRow = await createFileRecord({
      bucket: uploaded.bucket,
      objectKey: uploaded.key,
      originalName: fileName,
      mimeType: uploaded.contentType,
      sizeBytes: uploaded.sizeBytes,
      checksum,
      thumbnailKey: null,
      folderPath: `${propertyId}/videos`,
      isPublic: true,
      publicUrl: uploaded.publicUrl,
      ownerType: "property",
      ownerId: propertyId,
      uploadedBy: session.userId,
      metadata: uploaded.metadata,
    });

    const supabase = await createClient();
    const { count } = await supabase
      .from("property_videos")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId)
      .is("deleted_at", null);

    const { data: newVideo, error: insertError } = await supabase
      .from("property_videos")
      .insert({
        property_id: propertyId,
        file_id: fileRow.id,
        video_type: videoType,
        caption: caption?.trim() || null,
        sort_order: count ?? 0,
        created_by: session.userId,
        updated_by: session.userId,
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    revalidatePath(`/dashboard/properties/${propertyId}/setup`);
    revalidatePath(`/dashboard/properties/${propertyId}`);
    revalidatePath("/dashboard/properties");
    revalidatePath("/properties");

    return NextResponse.json({
      ok: true,
      video: {
        id: newVideo.id,
        publicUrl: uploaded.publicUrl,
        sizeBytes: uploaded.sizeBytes,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Video upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
