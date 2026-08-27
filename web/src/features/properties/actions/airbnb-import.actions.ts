"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSession } from "@/lib/dashboard/session";
import { createDraftProperty } from "@/features/properties/services/properties.service";
import { parseAirbnbListing, normalizeAmenityName } from "@/features/properties/services/airbnb-importer.service";
import { uploadFile, computeChecksum, BUCKETS } from "@/lib/storage/r2";
import { createFileRecord } from "@/lib/storage/file-service";
import { randomUUID } from "crypto";

function revalidate(propertyId: string) {
  revalidatePath(`/dashboard/properties/${propertyId}/setup`);
  revalidatePath(`/dashboard/properties/${propertyId}`);
  revalidatePath("/dashboard/properties");
  revalidatePath("/");
  revalidatePath("/properties");
}

export type ImportAirbnbResult = {
  success: boolean;
  propertyId?: string;
  error?: string;
  importedPhotosCount?: number;
  importedAmenitiesCount?: number;
};

export async function importAirbnbPropertyAction(
  airbnbUrl: string,
  targetPropertyId?: string
): Promise<ImportAirbnbResult> {
  const session = await getDashboardSession();
  if (!session) {
    return { success: false, error: "Sign in required." };
  }

  const canCreate = session.permissions.includes("create_property") || session.permissions.includes("manage_properties");
  const canEdit = session.permissions.includes("edit_property") || session.permissions.includes("manage_properties");

  if (targetPropertyId ? !canEdit : !canCreate) {
    return { success: false, error: "You don't have permission to import properties." };
  }

  try {
    // 1. Parse Airbnb Listing
    const extracted = await parseAirbnbListing(airbnbUrl);

    const supabase = await createClient();

    // 2. Obtain or Create Property ID
    let propertyId = targetPropertyId;
    if (!propertyId) {
      const draft = await createDraftProperty(extracted.name, session.userId);
      propertyId = draft.id;
    }

    // 3. Find matching Property Type
    const { data: types } = await supabase.from("property_types").select("id, name");
    let matchedTypeId: string | null = null;
    if (types && types.length > 0) {
      const typeMatch = types.find((t) => t.name.toLowerCase().includes((extracted.propertyType || "").toLowerCase())) || types[0];
      matchedTypeId = typeMatch.id;
    }

    const { data: activeStatus } = await supabase.from("property_status").select("id").eq("slug", "active").maybeSingle();

    // 4. Update Main Property Fields
    const { error: propertyError } = await supabase
      .from("properties")
      .update({
        name: extracted.name,
        type_id: matchedTypeId,
        status_id: activeStatus?.id || null,
        description: extracted.description,
        short_description: extracted.shortDescription || null,
        city: extracted.city || "Bengaluru",
        state: extracted.state || "Karnataka",
        country: extracted.country || "India",
        address: extracted.address || `${extracted.name}, ${extracted.city}`,
        pin_code: extracted.pinCode || null,
        bedrooms: extracted.bedrooms,
        bathrooms: extracted.bathrooms,
        max_guests: extracted.maxGuests,
        latitude: extracted.latitude || null,
        longitude: extracted.longitude || null,
        currency: extracted.currency || "INR",
        updated_by: session.userId,
      })
      .eq("id", propertyId);

    if (propertyError) throw propertyError;

    // 5. Update Base Pricing (if extracted)
    if (extracted.nightlyPrice && extracted.nightlyPrice > 0) {
      await supabase.from("property_pricing").upsert(
        {
          property_id: propertyId,
          base_price: extracted.nightlyPrice,
          currency: extracted.currency || "INR",
          updated_by: session.userId,
        },
        { onConflict: "property_id" }
      );
    }

    // 6. Update House Rules Defaults
    if (extracted.houseRules) {
      await supabase.from("properties").update({
        check_in_time: extracted.houseRules.checkIn || "14:00",
        check_out_time: extracted.houseRules.checkOut || "11:00",
        updated_by: session.userId,
      }).eq("id", propertyId);

      // Save Boolean & Preset rules matching STANDARD_HOUSE_RULES so presets list checkboxes tick automatically
      await supabase.from("property_rules").delete().eq("property_id", propertyId);
      const ruleRows = [
        { rule_key: "smoking", rule_text: extracted.houseRules.smokingAllowed ? "Smoking allowed" : "No smoking" },
        { rule_key: "pets", rule_text: extracted.houseRules.petsAllowed ? "Pets allowed" : "No pets" },
        { rule_key: "parties", rule_text: extracted.houseRules.partiesAllowed ? "Parties allowed" : "No parties or events" },
        { rule_key: "preset", rule_text: "Self check-in available" },
        { rule_key: "preset", rule_text: "Quiet hours (e.g., 10 PM–7 AM)" },
        { rule_key: "preset", rule_text: "Turn off lights, fans, and AC when leaving" },
        { rule_key: "preset", rule_text: "ID verification required" },
        { rule_key: "preset", rule_text: "EV charging only with permission" },
        { rule_key: "preset", rule_text: "Long-term stays allowed" },
      ];
      await supabase.from("property_rules").insert(
        ruleRows.map((r) => ({ property_id: propertyId, ...r, created_by: session.userId, updated_by: session.userId }))
      );
    }

    // 7. Process & Map Amenities
    let importedAmenitiesCount = 0;
    if (extracted.amenityNames && extracted.amenityNames.length > 0) {
      const { data: allMaster } = await supabase.from("amenity_master").select("id, name, slug");
      const masterMap = new Map((allMaster ?? []).map((a) => [a.name.toLowerCase(), a.id]));
      const slugMap = new Map((allMaster ?? []).map((a) => [a.slug.toLowerCase(), a.id]));

      const targetAmenityIds: string[] = [];

      for (const rawName of extracted.amenityNames) {
        const norm = normalizeAmenityName(rawName);
        const lowerName = norm.name.toLowerCase();

        let amenityId = masterMap.get(lowerName) || slugMap.get(norm.slug);
        if (!amenityId) {
          // Insert missing amenity into master table with smart category
          const { data: created } = await supabase
            .from("amenity_master")
            .insert({
              name: norm.name,
              slug: norm.slug,
              category: norm.category,
              created_by: session.userId,
              updated_by: session.userId,
            })
            .select("id")
            .single();

          if (created) {
            amenityId = created.id;
            masterMap.set(lowerName, created.id);
            slugMap.set(norm.slug, created.id);
          }
        }

        if (amenityId && !targetAmenityIds.includes(amenityId)) {
          targetAmenityIds.push(amenityId);
        }
      }

      if (targetAmenityIds.length > 0) {
        // Delete existing amenities & insert new ones
        await supabase.from("property_amenities").delete().eq("property_id", propertyId);
        const { error: insertAmenityError } = await supabase.from("property_amenities").insert(
          targetAmenityIds.map((amenityId) => ({
            property_id: propertyId,
            amenity_id: amenityId,
            created_by: session.userId,
            updated_by: session.userId,
          }))
        );
        if (!insertAmenityError) {
          importedAmenitiesCount = targetAmenityIds.length;
        }
      }
    }

    // 8. Store High-Res Photos to R2 & DB (with automatic fallback to Airbnb CDN publicUrl if R2 is not configured)
    let importedPhotosCount = 0;
    if (extracted.photos && extracted.photos.length > 0) {
      const photosToProcess = extracted.photos;

      await Promise.allSettled(
        photosToProcess.map(async (photo, idx) => {
          try {
            const isCover = idx === 0;
            const filename = `airbnb_${extracted.roomId}_${idx + 1}.jpg`;
            const defaultObjectKey = `airbnb/${extracted.roomId}/${randomUUID()}-${filename}`;

            let bucket: import("@/lib/storage/r2").Bucket = BUCKETS.propertyImages;
            let objectKey = defaultObjectKey;
            let publicUrl: string | null = photo.url;
            let mimeType = "image/jpeg";
            let sizeBytes = 100000;
            let checksum = randomUUID().replace(/-/g, "");
            let thumbnailKey: string | null = null;
            let metadata: Record<string, unknown> = {};

            // Try uploading binary to Cloudflare R2 if available
            try {
              const res = await fetch(photo.url, {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                },
              });

              if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                if (buffer.length >= 5000) {
                  checksum = computeChecksum(buffer);
                  sizeBytes = buffer.length;

                  const uploaded = await uploadFile({
                    bucket: BUCKETS.propertyImages,
                    key: `${session.userId}/${randomUUID()}-${filename}`,
                    body: buffer,
                    contentType: "image/jpeg",
                    makePublic: true,
                  });

                  bucket = uploaded.bucket;
                  objectKey = uploaded.key;
                  publicUrl = uploaded.publicUrl || photo.url;
                  mimeType = uploaded.contentType;
                  thumbnailKey = uploaded.thumbnailKey;
                  metadata = uploaded.metadata;
                }
              }
            } catch (r2Err) {
              console.warn(`R2 upload skipped for photo ${idx + 1}, storing direct public URL:`, r2Err);
            }

            const fileRow = await createFileRecord({
              bucket,
              objectKey,
              originalName: filename,
              mimeType,
              sizeBytes,
              checksum,
              thumbnailKey,
              folderPath: `${propertyId}/gallery`,
              isPublic: true,
              publicUrl,
              ownerType: "property",
              ownerId: propertyId,
              uploadedBy: session.userId,
              metadata,
            });

            const { count: existingCount } = await supabase
              .from("property_photos")
              .select("id", { count: "exact", head: true })
              .eq("property_id", propertyId)
              .is("deleted_at", null);

            const { data: newPhotoId, error: rpcError } = await supabase.rpc("create_property_photo", {
              p_property_id: propertyId,
              p_file_id: fileRow.id,
              p_sort_order: (existingCount || 0) + idx,
            });

            if (rpcError) {
              console.error(`create_property_photo RPC error for photo ${idx + 1}:`, rpcError);
            } else if (newPhotoId) {
              const spaceTag = (photo as any).spaceTag || (idx === 0 ? "Exterior" : "Living Room");
              await supabase
                .from("property_photos")
                .update({
                  tags: [spaceTag],
                  caption: photo.caption || (isCover ? "Cover Image" : `${spaceTag} ${idx + 1}`),
                  ...(isCover ? { is_cover: true } : {}),
                  updated_by: session.userId,
                })
                .eq("id", newPhotoId as string);

              if (isCover) {
                await supabase
                  .from("property_photos")
                  .update({ is_cover: false, updated_by: session.userId })
                  .eq("property_id", propertyId)
                  .neq("id", newPhotoId as string);
              }

              importedPhotosCount++;
            }
          } catch (imgErr) {
            console.warn(`Failed to import Airbnb photo ${idx + 1}:`, imgErr);
          }
        })
      );
    }

    revalidate(propertyId);

    return {
      success: true,
      propertyId,
      importedPhotosCount,
      importedAmenitiesCount,
    };
  } catch (err: unknown) {
    console.error("Error importing Airbnb listing:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to import property from Airbnb link.",
    };
  }
}
