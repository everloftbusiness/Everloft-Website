"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSession } from "@/lib/dashboard/session";
import { uploadFile, computeChecksum, BUCKETS } from "@/lib/storage/r2";
import { createFileRecord } from "@/lib/storage/file-service";
import { randomUUID } from "crypto";

async function requireEditAccess(propertyId: string) {
  if (!z.string().uuid().safeParse(propertyId).success) throw new Error("Invalid property.");
  const session = await getDashboardSession();
  if (!session) throw new Error("Sign in required.");
  if (!session.permissions.includes("edit_property") && !session.permissions.includes("manage_properties")) {
    throw new Error("You don't have permission to edit this property.");
  }
  return session;
}

function revalidate(propertyId: string) {
  revalidatePath(`/dashboard/properties/${propertyId}/setup`);
  revalidatePath(`/dashboard/properties/${propertyId}`);
  revalidatePath("/dashboard/properties");
  revalidatePath("/");
  revalidatePath("/properties");
}

// --- Basics ---
const basicsSchema = z.object({
  typeId: z.string().uuid(),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  maxGuests: z.coerce.number().int().min(1),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
});

export async function saveBasicsAction(propertyId: string, formData: FormData) {
  const session = await requireEditAccess(propertyId);
  const input = basicsSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({
      type_id: input.typeId,
      category_id: input.categoryId || null,
      max_guests: input.maxGuests,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      updated_by: session.userId,
    })
    .eq("id", propertyId);
  if (error) throw error;
  revalidate(propertyId);
  return { ok: true };
}

// --- Location ---
const locationSchema = z.object({
  country: z.string().min(1),
  state: z.string().optional(),
  city: z.string().min(1),
  address: z.string().min(1),
  latitude: z.coerce.number().optional().or(z.literal("")),
  longitude: z.coerce.number().optional().or(z.literal("")),
  googleMapsUrl: z.string().url().optional().or(z.literal("")),
});

export async function saveLocationAction(propertyId: string, formData: FormData) {
  const session = await requireEditAccess(propertyId);
  const input = locationSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({
      country: input.country,
      state: input.state || null,
      city: input.city,
      address: input.address,
      latitude: input.latitude === "" || input.latitude === undefined ? null : input.latitude,
      longitude: input.longitude === "" || input.longitude === undefined ? null : input.longitude,
      google_maps_url: input.googleMapsUrl || null,
      updated_by: session.userId,
    })
    .eq("id", propertyId);
  if (error) throw error;
  revalidate(propertyId);
  return { ok: true };
}

// --- Title ---
const titleSchema = z.object({
  name: z.string().min(4).max(80),
  shortName: z.string().max(50).optional(),
});

export async function saveTitleAction(propertyId: string, formData: FormData) {
  const session = await requireEditAccess(propertyId);
  const input = titleSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({ name: input.name, short_name: input.shortName || null, updated_by: session.userId })
    .eq("id", propertyId);
  if (error) throw error;
  revalidate(propertyId);
  return { ok: true };
}

// --- Description ---
const descriptionSchema = z.object({
  description: z.string().min(1),
  shortDescription: z.string().max(300).optional(),
});

export async function saveDescriptionAction(propertyId: string, formData: FormData) {
  const session = await requireEditAccess(propertyId);
  const input = descriptionSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({ description: input.description, short_description: input.shortDescription || null, updated_by: session.userId })
    .eq("id", propertyId);
  if (error) throw error;
  revalidate(propertyId);
  return { ok: true };
}

// --- Amenities (full replace) ---
export async function saveAmenitiesAction(propertyId: string, amenityIds: string[]) {
  const session = await requireEditAccess(propertyId);
  const supabase = await createClient();

  const { error: deleteError } = await supabase.from("property_amenities").delete().eq("property_id", propertyId);
  if (deleteError) throw deleteError;

  if (amenityIds.length > 0) {
    const { error: insertError } = await supabase.from("property_amenities").insert(
      amenityIds.map((amenityId) => ({
        property_id: propertyId,
        amenity_id: amenityId,
        created_by: session.userId,
        updated_by: session.userId,
      }))
    );
    if (insertError) throw insertError;
  }
  revalidate(propertyId);
  return { ok: true };
}

// --- House Rules ---
const houseRulesSchema = z.object({
  checkInTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  checkOutTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  securityDepositAmount: z.coerce.number().min(0).optional().or(z.literal("")),
  securityDepositCurrency: z.string().length(3).optional().or(z.literal("")),
  smokingAllowed: z.coerce.boolean().optional(),
  petsAllowed: z.coerce.boolean().optional(),
  partiesAllowed: z.coerce.boolean().optional(),
});

export async function saveHouseRulesAction(propertyId: string, formData: FormData) {
  const session = await requireEditAccess(propertyId);
  const raw = Object.fromEntries(formData.entries());
  const input = houseRulesSchema.parse({
    ...raw,
    smokingAllowed: raw.smokingAllowed === "on" || raw.smokingAllowed === "true",
    petsAllowed: raw.petsAllowed === "on" || raw.petsAllowed === "true",
    partiesAllowed: raw.partiesAllowed === "on" || raw.partiesAllowed === "true",
  });
  const supabase = await createClient();

  const { error: propError } = await supabase
    .from("properties")
    .update({
      check_in_time: input.checkInTime,
      check_out_time: input.checkOutTime,
      security_deposit_amount: input.securityDepositAmount === "" || input.securityDepositAmount === undefined
        ? null
        : input.securityDepositAmount,
      security_deposit_currency: input.securityDepositCurrency || null,
      updated_by: session.userId,
    })
    .eq("id", propertyId);
  if (propError) throw propError;

  const { error: deleteRulesError } = await supabase
    .from("property_rules")
    .delete()
    .eq("property_id", propertyId)
    .in("rule_key", ["smoking", "pets", "parties"]);
  if (deleteRulesError) throw deleteRulesError;
  const ruleRows = [
    { rule_key: "smoking", rule_text: input.smokingAllowed ? "Smoking allowed" : "No smoking" },
    { rule_key: "pets", rule_text: input.petsAllowed ? "Pets allowed" : "No pets" },
    { rule_key: "parties", rule_text: input.partiesAllowed ? "Parties allowed" : "No parties or events" },
  ];
  const { error: rulesError } = await supabase.from("property_rules").insert(
    ruleRows.map((r) => ({ property_id: propertyId, ...r, created_by: session.userId, updated_by: session.userId }))
  );
  if (rulesError) throw rulesError;

  revalidate(propertyId);
  return { ok: true };
}

// --- House Rules: preset picker + custom free-text entries ---
// Full replace of rule_key in ('preset','custom') rows only — never touches
// the smoking/pets/parties/checkInTime fields owned by saveHouseRulesAction
// above, since those use distinct rule_key values.
export async function saveHouseRulePresetsAction(propertyId: string, presets: string[], customRules: string[]) {
  const session = await requireEditAccess(propertyId);
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("property_rules")
    .delete()
    .eq("property_id", propertyId)
    .in("rule_key", ["preset", "custom"]);
  if (deleteError) throw deleteError;

  const rows = [
    ...presets.map((text) => ({ rule_key: "preset", rule_text: text })),
    ...customRules.filter((t) => t.trim()).map((text) => ({ rule_key: "custom", rule_text: text.trim() })),
  ];
  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("property_rules").insert(
      rows.map((r) => ({ property_id: propertyId, ...r, created_by: session.userId, updated_by: session.userId }))
    );
    if (insertError) throw insertError;
  }

  revalidate(propertyId);
  return { ok: true };
}

// --- Pricing (upsert) — Base Pricing + Guest Pricing groups
// (docs/PROPERTY_SETUP_DASHBOARD_V2_IMPROVEMENTS.md §8, groups 1 & 3)
const pricingSchema = z.object({
  basePrice: z.coerce.number().positive(),
  weekendPrice: z.coerce.number().positive().optional().or(z.literal("")),
  weekdayPrice: z.coerce.number().positive().optional().or(z.literal("")),
  minNightlyPrice: z.coerce.number().min(0).optional().or(z.literal("")),
  maxNightlyPrice: z.coerce.number().min(0).optional().or(z.literal("")),
  cleaningFee: z.coerce.number().min(0).optional().or(z.literal("")),
  extraGuestFee: z.coerce.number().min(0).optional().or(z.literal("")),
  standardOccupancy: z.coerce.number().int().min(1).optional().or(z.literal("")),
  childFee: z.coerce.number().min(0).optional().or(z.literal("")),
  infantFee: z.coerce.number().min(0).optional().or(z.literal("")),
  petFee: z.coerce.number().min(0).optional().or(z.literal("")),
  visitorFee: z.coerce.number().min(0).optional().or(z.literal("")),
  currency: z.string().length(3).default("INR"),
});

export async function savePricingAction(propertyId: string, formData: FormData) {
  const session = await requireEditAccess(propertyId);
  const input = pricingSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = await createClient();

  const patch = {
    property_id: propertyId,
    base_price: input.basePrice,
    weekend_price: input.weekendPrice || null,
    weekday_price: input.weekdayPrice || null,
    min_nightly_price: input.minNightlyPrice || null,
    max_nightly_price: input.maxNightlyPrice || null,
    cleaning_fee: input.cleaningFee || 0,
    extra_guest_fee: input.extraGuestFee || 0,
    standard_occupancy: input.standardOccupancy || null,
    child_fee: input.childFee || 0,
    infant_fee: input.infantFee || 0,
    pet_fee: input.petFee || 0,
    visitor_fee: input.visitorFee || 0,
    currency: input.currency,
    updated_by: session.userId,
  };

  const { data: existing } = await supabase.from("property_pricing").select("property_id").eq("property_id", propertyId).maybeSingle();
  const { error } = existing
    ? await supabase.from("property_pricing").update(patch).eq("property_id", propertyId)
    : await supabase.from("property_pricing").insert({ ...patch, created_by: session.userId });
  if (error) throw error;

  revalidate(propertyId);
  return { ok: true };
}

// --- Discounts / Fees / Taxes: simple list managers (add/remove rows) ---
const discountSchema = z.object({
  discountType: z.enum([
    "last_minute", "early_bird", "non_refundable", "long_stay",
    "repeat_guest", "promo_coupon", "first_booking", "seasonal_promo",
  ]),
  valuePercent: z.number().min(0).max(100),
  couponCode: z.string().optional(),
});

export async function addDiscountAction(propertyId: string, input: z.infer<typeof discountSchema>) {
  const session = await requireEditAccess(propertyId);
  const parsed = discountSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("property_discounts").insert({
    property_id: propertyId,
    discount_type: parsed.discountType,
    value_percent: parsed.valuePercent,
    coupon_code: parsed.couponCode || null,
    created_by: session.userId,
    updated_by: session.userId,
  });
  if (error) throw error;
  revalidate(propertyId);
  return { ok: true };
}

export async function removeDiscountAction(propertyId: string, discountId: string) {
  await requireEditAccess(propertyId);
  const supabase = await createClient();
  const { error } = await supabase.from("property_discounts").update({ deleted_at: new Date().toISOString() }).eq("id", discountId);
  if (error) throw error;
  revalidate(propertyId);
  return { ok: true };
}

const feeSchema = z.object({
  feeType: z.enum([
    "linen", "laundry", "resort", "service", "utility",
    "damage_waiver", "late_checkout", "early_checkin", "extra_bed",
  ]),
  amount: z.number().min(0),
  isPercentage: z.boolean().default(false),
});

export async function addFeeAction(propertyId: string, input: z.infer<typeof feeSchema>) {
  const session = await requireEditAccess(propertyId);
  const parsed = feeSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("property_fees").insert({
    property_id: propertyId,
    fee_type: parsed.feeType,
    amount: parsed.amount,
    is_percentage: parsed.isPercentage,
    created_by: session.userId,
    updated_by: session.userId,
  });
  if (error) throw error;
  revalidate(propertyId);
  return { ok: true };
}

export async function removeFeeAction(propertyId: string, feeId: string) {
  await requireEditAccess(propertyId);
  const supabase = await createClient();
  const { error } = await supabase.from("property_fees").update({ deleted_at: new Date().toISOString() }).eq("id", feeId);
  if (error) throw error;
  revalidate(propertyId);
  return { ok: true };
}

const taxSchema = z.object({
  taxName: z.string().min(1),
  taxType: z.enum(["gst", "vat", "occupancy_tax", "luxury_tax", "other"]),
  ratePercent: z.number().min(0).max(100),
  isInclusive: z.boolean().default(false),
});

export async function addTaxAction(propertyId: string, input: z.infer<typeof taxSchema>) {
  const session = await requireEditAccess(propertyId);
  const parsed = taxSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("property_taxes").insert({
    property_id: propertyId,
    tax_name: parsed.taxName,
    tax_type: parsed.taxType,
    rate_percent: parsed.ratePercent,
    is_inclusive: parsed.isInclusive,
    created_by: session.userId,
    updated_by: session.userId,
  });
  if (error) throw error;
  revalidate(propertyId);
  return { ok: true };
}

export async function removeTaxAction(propertyId: string, taxId: string) {
  await requireEditAccess(propertyId);
  const supabase = await createClient();
  const { error } = await supabase.from("property_taxes").update({ deleted_at: new Date().toISOString() }).eq("id", taxId);
  if (error) throw error;
  revalidate(propertyId);
  return { ok: true };
}

// --- Availability (upsert property_settings, only its own fields) —
// includes the "Stay Rules" pricing group's same-day-booking fields.
const availabilitySchema = z.object({
  minStayNights: z.coerce.number().int().min(1).default(1),
  maxStayNights: z.coerce.number().int().min(1).optional().or(z.literal("")),
  advanceNoticeHours: z.coerce.number().int().min(0).default(24),
  instantBook: z.coerce.boolean().optional(),
  sameDayBookingAllowed: z.coerce.boolean().optional(),
  sameDayCutoffTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().or(z.literal("")),
});

async function upsertPropertySettings(propertyId: string, patch: Record<string, unknown>, userId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("property_settings").select("property_id").eq("property_id", propertyId).maybeSingle();
  const { error } = existing
    ? await supabase.from("property_settings").update({ ...patch, updated_by: userId }).eq("property_id", propertyId)
    : await supabase.from("property_settings").insert({ property_id: propertyId, ...patch, created_by: userId, updated_by: userId });
  if (error) throw error;
}

export async function saveAvailabilityAction(propertyId: string, formData: FormData) {
  const session = await requireEditAccess(propertyId);
  const raw = Object.fromEntries(formData.entries());
  const input = availabilitySchema.parse({
    ...raw,
    instantBook: raw.instantBook === "on" || raw.instantBook === "true",
    sameDayBookingAllowed: raw.sameDayBookingAllowed === "on" || raw.sameDayBookingAllowed === "true",
  });

  await upsertPropertySettings(
    propertyId,
    {
      min_stay_nights: input.minStayNights,
      max_stay_nights: input.maxStayNights || null,
      advance_notice_hours: input.advanceNoticeHours,
      instant_book: input.instantBook,
      same_day_booking_allowed: input.sameDayBookingAllowed,
      same_day_cutoff_time: input.sameDayCutoffTime || null,
    },
    session.userId
  );
  revalidate(propertyId);
  return { ok: true };
}

// --- Guest Requirements (upsert property_settings, only its own fields) ---
const guestRequirementsSchema = z.object({
  checkInMethod: z.enum(["host_greeting", "self_check_in", "smart_lock", "lockbox"]),
  requiresGovernmentId: z.coerce.boolean().optional(),
  requiresGoodReviews: z.coerce.boolean().optional(),
  requiresHostApproval: z.coerce.boolean().optional(),
});

export async function saveGuestRequirementsAction(propertyId: string, formData: FormData) {
  const session = await requireEditAccess(propertyId);
  const raw = Object.fromEntries(formData.entries());
  const input = guestRequirementsSchema.parse({
    ...raw,
    requiresGovernmentId: raw.requiresGovernmentId === "on" || raw.requiresGovernmentId === "true",
    requiresGoodReviews: raw.requiresGoodReviews === "on" || raw.requiresGoodReviews === "true",
    requiresHostApproval: raw.requiresHostApproval === "on" || raw.requiresHostApproval === "true",
  });

  await upsertPropertySettings(
    propertyId,
    {
      check_in_method: input.checkInMethod,
      requires_government_id: input.requiresGovernmentId,
      requires_good_reviews: input.requiresGoodReviews,
      requires_host_approval: input.requiresHostApproval,
    },
    session.userId
  );
  revalidate(propertyId);
  return { ok: true };
}

// --- Photos ---
export async function uploadPropertyPhotoAction(propertyId: string, formData: FormData) {
  const session = await requireEditAccess(propertyId);
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("A file is required.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const objectKey = `${session.userId}/${randomUUID()}-${file.name}`;
  const checksum = computeChecksum(buffer);
  const uploaded = await uploadFile({
    bucket: BUCKETS.propertyImages,
    key: objectKey,
    body: buffer,
    contentType: file.type || "image/jpeg",
    makePublic: true,
  });
  const fileRow = await createFileRecord({
    bucket: uploaded.bucket,
    objectKey: uploaded.key,
    originalName: file.name,
    mimeType: uploaded.contentType,
    sizeBytes: uploaded.sizeBytes,
    checksum,
    thumbnailKey: uploaded.thumbnailKey,
    folderPath: `${propertyId}/gallery`,
    isPublic: true,
    publicUrl: uploaded.publicUrl,
    ownerType: "property",
    ownerId: propertyId,
    uploadedBy: session.userId,
    metadata: uploaded.metadata,
  });

  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("property_photos")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId)
    .is("deleted_at", null);
  if (countError) throw countError;

  const { error } = await supabase.rpc("create_property_photo", {
    p_property_id: propertyId,
    p_file_id: fileRow.id,
    p_sort_order: count ?? 0,
  });
  if (error) throw error;

  revalidate(propertyId);
  return { ok: true };
}

export async function setCoverPhotoAction(propertyId: string, propertyPhotoId: string) {
  const session = await requireEditAccess(propertyId);
  const supabase = await createClient();
  await supabase.from("property_photos").update({ is_cover: false, updated_by: session.userId }).eq("property_id", propertyId);
  const { error } = await supabase
    .from("property_photos")
    .update({ is_cover: true, updated_by: session.userId })
    .eq("id", propertyPhotoId);
  if (error) throw error;
  revalidate(propertyId);
  return { ok: true };
}

export async function removePropertyPhotoAction(propertyId: string, propertyPhotoId: string) {
  const session = await requireEditAccess(propertyId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("property_photos")
    .update({ deleted_at: new Date().toISOString(), updated_by: session.userId })
    .eq("id", propertyPhotoId);
  if (error) throw error;
  revalidate(propertyId);
  return { ok: true };
}

// --- Publish (gated by required-section completion) ---
// Super Admin is the final approver and can make a listing live immediately.
// Other authorized roles submit it for the normal review workflow.
export async function publishPropertyAction(propertyId: string) {
  const session = await requireEditAccess(propertyId);
  const { getOnboardingSnapshot } = await import("@/features/properties/services/onboarding.service");
  const snapshot = await getOnboardingSnapshot(propertyId);
  if (!snapshot) throw new Error("Property not found.");
  if (!snapshot.canPublish) {
    throw new Error(`Complete required sections first: ${snapshot.missingRequiredLabels.join(", ")}.`);
  }

  const supabase = await createClient();
  const targetStatusSlug = session.role === "super_admin" ? "active" : "pending_review";
  const { data: targetStatus } = await supabase
    .from("property_status")
    .select("id")
    .eq("slug", targetStatusSlug)
    .maybeSingle();
  if (!targetStatus) throw new Error(`${targetStatusSlug} status not found.`);

  const { error } = await supabase
    .from("properties")
    .update({ status_id: targetStatus.id, updated_by: session.userId })
    .eq("id", propertyId);
  if (error) throw error;

  revalidate(propertyId);
  return { ok: true };
}

export async function saveDraftAction(propertyId: string) {
  await requireEditAccess(propertyId);
  revalidate(propertyId);
  return { ok: true, savedAt: new Date().toISOString() };
}
