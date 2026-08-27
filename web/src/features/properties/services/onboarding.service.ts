import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type SectionKey =
  | "basics"
  | "location"
  | "photos"
  | "videos"
  | "title"
  | "description"
  | "amenities"
  | "houseRules"
  | "pricing"
  | "availability"
  | "guestRequirements";

export type SectionStatus = "not_started" | "in_progress" | "completed" | "needs_review";

export type SectionCompletion = {
  key: SectionKey;
  label: string;
  description: string;
  completionPercent: number;
  status: SectionStatus;
  fieldsCompleted: number;
  fieldsTotal: number;
  required: boolean;
  allRequiredFieldsFilled: boolean;
};

export type CoachRecommendation = {
  priority: "high" | "medium" | "low";
  reason: string;
  action: string;
};

export type OnboardingSnapshot = {
  propertyId: string;
  propertyName: string;
  sections: SectionCompletion[];
  overallCompletionPercent: number;
  requiredRemaining: number;
  recommendedRemaining: number;
  estimatedMinutesRemaining: number;
  readinessScore: number;
  readinessBreakdown: { label: string; percent: number }[];
  coach: CoachRecommendation[];
  canPublish: boolean;
  missingRequiredLabels: string[];
  lastEditedAt: string;
};

// Weighted field score: required fields count double toward their section's
// own percentage — docs/PROPERTY_ONBOARDING_EXPERIENCE.md §6. `allRequiredFilled`
// is tracked separately from `percent` on purpose: a section can carry an
// optional field (e.g. "20+ photos") that keeps the *display* percentage
// below 100 even once every field that actually matters for Publish is
// done — the publish gate (§8) must key off allRequiredFilled, never off
// percent === 100, or a section with any optional field becomes physically
// impossible to fully satisfy.
function scoreFields(fields: {
  filled: boolean;
  required: boolean;
}[]): { percent: number; completed: number; total: number; allRequiredFilled: boolean } {
  if (fields.length === 0) return { percent: 100, completed: 0, total: 0, allRequiredFilled: true };
  const weightOf = (f: { required: boolean }) => (f.required ? 2 : 1);
  const totalWeight = fields.reduce((sum, f) => sum + weightOf(f), 0);
  const gotWeight = fields.reduce((sum, f) => sum + (f.filled ? weightOf(f) : 0), 0);
  return {
    percent: Math.round((gotWeight / totalWeight) * 100),
    completed: fields.filter((f) => f.filled).length,
    total: fields.length,
    allRequiredFilled: fields.filter((f) => f.required).every((f) => f.filled),
  };
}

function statusFor(percent: number, allRequiredFilled?: boolean): SectionStatus {
  if (allRequiredFilled || percent >= 100) return "completed";
  if (percent === 0) return "not_started";
  return "in_progress";
}

export async function getOnboardingFormData(propertyId: string) {
  const supabase = createAdminClient();

  const [
    { data: property },
    { data: pricing },
    { data: settings },
    { data: rules },
    { data: propertyAmenities },
    { data: photos },
    { data: videos },
    { data: types },
    { data: categories },
    { data: amenityMaster },
    { data: discounts },
    { data: fees },
    { data: taxes },
  ] = await Promise.all([
    supabase.from("properties").select("*").eq("id", propertyId).is("deleted_at", null).maybeSingle(),
    supabase.from("property_pricing").select("*").eq("property_id", propertyId).maybeSingle(),
    supabase.from("property_settings").select("*").eq("property_id", propertyId).maybeSingle(),
    supabase.from("property_rules").select("rule_key, rule_text").eq("property_id", propertyId).is("deleted_at", null),
    supabase.from("property_amenities").select("amenity_id").eq("property_id", propertyId).is("deleted_at", null),
    supabase
      .from("property_photos")
      .select("id, file_id, is_cover, sort_order, caption, tags")
      .eq("property_id", propertyId)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase
      .from("property_videos")
      .select("id, file_id, video_type, caption, sort_order")
      .eq("property_id", propertyId)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase.from("property_types").select("id, slug, name").order("sort_order"),
    supabase.from("property_categories").select("id, slug, name").order("sort_order"),
    supabase.from("amenity_master").select("id, slug, name, category").order("sort_order"),
    supabase.from("property_discounts").select("id, discount_type, value_percent, coupon_code").eq("property_id", propertyId).is("deleted_at", null),
    supabase.from("property_fees").select("id, fee_type, amount, is_percentage").eq("property_id", propertyId).is("deleted_at", null),
    supabase.from("property_taxes").select("id, tax_name, tax_type, rate_percent, is_inclusive").eq("property_id", propertyId).is("deleted_at", null),
  ]);

  if (!property) return null;

  const photoFileIds = (photos ?? []).map((p) => p.file_id);
  const videoFileIds = (videos ?? []).map((v) => v.file_id);
  const allFileIds = [...new Set([...photoFileIds, ...videoFileIds])];

  let fileMap = new Map<string, { public_url: string | null; bucket: string; object_key: string }>();
  if (allFileIds.length > 0) {
    const { data: files } = await supabase.from("files").select("id, public_url, bucket, object_key").in("id", allFileIds);
    fileMap = new Map((files ?? []).map((f) => [f.id, { public_url: f.public_url, bucket: f.bucket, object_key: f.object_key }]));
  }

  // Prefer the permanent public_url (works once R2_PUBLIC_BASE_URL/a custom
  // domain is configured, per docs/PROPERTY_SETUP_DASHBOARD_V2_IMPROVEMENTS.md
  // §4); fall back to a freshly-signed URL so previews work today regardless.
  const { getViewUrl } = await import("@/lib/storage/file-service");
  async function resolvePreviewUrl(fileId: string): Promise<string | null> {
    const file = fileMap.get(fileId);
    if (!file) return null;
    if (file.public_url) return file.public_url;
    try {
      return await getViewUrl(fileId, 3600);
    } catch {
      return null;
    }
  }

  const ruleMap = new Map((rules ?? []).map((r) => [r.rule_key, r.rule_text]));

  const photosWithPreview = await Promise.all(
    (photos ?? []).map(async (p) => {
      const spaceTag = (p.tags && p.tags.length > 0 ? p.tags[0] : null) || p.caption || "Living Room";
      return {
        id: p.id,
        isCover: p.is_cover,
        caption: p.caption,
        tags: p.tags ?? [],
        spaceTag,
        sortOrder: p.sort_order,
        publicUrl: await resolvePreviewUrl(p.file_id),
      };
    })
  );
  const videosWithPreview = await Promise.all(
    (videos ?? []).map(async (v) => ({
      id: v.id,
      videoType: v.video_type,
      caption: v.caption,
      publicUrl: await resolvePreviewUrl(v.file_id),
    }))
  );
  const coverPhoto = (photos ?? []).find((p) => p.is_cover);
  const coverPhotoUrl = coverPhoto ? await resolvePreviewUrl(coverPhoto.file_id) : null;

  let roomSpecs: import("@/features/properties/types/property.types").PropertyRoomSpecs = {};
  const roomSpecsRule = (rules ?? []).find((r) => r.rule_key === "room_specs");
  if (roomSpecsRule?.rule_text) {
    try {
      roomSpecs = JSON.parse(roomSpecsRule.rule_text);
    } catch {}
  }

  let savedCustomSpaces: string[] = [];
  const customSpacesRule = (rules ?? []).find((r) => r.rule_key === "custom_spaces");
  if (customSpacesRule?.rule_text) {
    try {
      savedCustomSpaces = JSON.parse(customSpacesRule.rule_text);
    } catch {}
  }

  const customAmenitiesFromRules = (rules ?? [])
    .filter((r) => r.rule_key === "custom_amenity")
    .map((r, idx) => ({
      id: `custom_rule_${r.rule_text}`,
      slug: `custom_amenity_${idx}`,
      name: r.rule_text,
      category: "entertainment",
      isCustom: true,
    }));

  const allAmenityMaster = [
    ...(amenityMaster ?? []).map((a) => ({ ...a, isCustom: false })),
    ...customAmenitiesFromRules,
  ];

  const selectedAmenityIds = [
    ...(propertyAmenities ?? []).map((a) => a.amenity_id),
    ...customAmenitiesFromRules.map((c) => c.id),
  ];

  return {
    property,
    pricing: pricing ?? null,
    settings: settings ?? null,
    roomSpecs,
    savedCustomSpaces,
    smokingAllowed: (ruleMap.get("smoking") ?? "").includes("allowed") && !(ruleMap.get("smoking") ?? "").startsWith("No"),
    petsAllowed: (ruleMap.get("pets") ?? "").includes("allowed") && !(ruleMap.get("pets") ?? "").startsWith("No"),
    partiesAllowed: (ruleMap.get("parties") ?? "").includes("allowed") && !(ruleMap.get("parties") ?? "").startsWith("No"),
    presetRuleTexts: [
      ...(rules ?? []).filter((r) => r.rule_key === "preset").map((r) => r.rule_text),
      ...(ruleMap.get("smoking") ? [ruleMap.get("smoking")!] : []),
      ...(ruleMap.get("pets") ? [ruleMap.get("pets")!] : []),
      ...(ruleMap.get("parties") ? [ruleMap.get("parties")!] : []),
    ],
    customRuleTexts: (rules ?? []).filter((r) => r.rule_key === "custom").map((r) => r.rule_text),
    selectedAmenityIds,
    photos: photosWithPreview,
    videos: videosWithPreview,
    coverPhotoUrl,
    types: types ?? [],
    categories: categories ?? [],
    amenityMaster: allAmenityMaster,
    discounts: (discounts ?? []).map((d) => ({
      id: d.id,
      discountType: d.discount_type,
      valuePercent: Number(d.value_percent),
      couponCode: d.coupon_code,
    })),
    fees: (fees ?? []).map((f) => ({ id: f.id, feeType: f.fee_type, amount: Number(f.amount), isPercentage: f.is_percentage })),
    taxes: (taxes ?? []).map((t) => ({
      id: t.id,
      taxName: t.tax_name,
      taxType: t.tax_type,
      ratePercent: Number(t.rate_percent),
      isInclusive: t.is_inclusive,
    })),
  };
}

export async function getOnboardingSnapshot(propertyId: string): Promise<OnboardingSnapshot | null> {
  const supabase = createAdminClient();

  const { data: property } = await supabase.from("properties").select("*").eq("id", propertyId).is("deleted_at", null).maybeSingle();
  if (!property) return null;

  const [{ data: photos }, { data: videos }, { data: amenities }, { data: rules }, { data: pricing }, { data: settings }] = await Promise.all([
    supabase.from("property_photos").select("id, is_cover").eq("property_id", propertyId).is("deleted_at", null),
    supabase.from("property_videos").select("id").eq("property_id", propertyId).is("deleted_at", null),
    supabase.from("property_amenities").select("id").eq("property_id", propertyId).is("deleted_at", null),
    supabase.from("property_rules").select("rule_key, rule_text").eq("property_id", propertyId).is("deleted_at", null),
    supabase.from("property_pricing").select("*").eq("property_id", propertyId).maybeSingle(),
    supabase.from("property_settings").select("*").eq("property_id", propertyId).maybeSingle(),
  ]);

  const photoCount = photos?.length ?? 0;
  const videoCount = videos?.length ?? 0;
  const hasCover = (photos ?? []).some((p) => p.is_cover);
  const amenityCount = amenities?.length ?? 0;
  const ruleKeys = new Set((rules ?? []).map((r) => r.rule_key));
  const descriptionLength = (property.description ?? "").length;

  // --- Section: Basics ---
  const basics = scoreFields([
    { filled: Boolean(property.type_id), required: true },
    { filled: Boolean(property.max_guests), required: true },
    { filled: property.bedrooms !== null, required: true },
    { filled: property.bathrooms !== null, required: true },
    { filled: Boolean(property.category_id), required: false },
  ]);

  // --- Section: Location ---
  const location = scoreFields([
    { filled: Boolean(property.country), required: true },
    { filled: Boolean(property.city), required: true },
    { filled: Boolean(property.address), required: true },
    { filled: property.latitude !== null && property.longitude !== null, required: false },
    { filled: Boolean(property.google_maps_url), required: false },
  ]);

  // --- Section: Photos ---
  const photosSection = scoreFields([
    { filled: hasCover, required: true },
    { filled: photoCount >= 5, required: true },
    { filled: photoCount >= 20, required: false },
  ]);

  // --- Section: Videos (recommended bonus) ---
  const videosSection = scoreFields([{ filled: videoCount >= 1, required: false }]);

  // --- Section: Title ---
  const title = scoreFields([
    { filled: Boolean(property.name) && property.name.length >= 4, required: true },
    { filled: Boolean(property.short_name), required: false },
  ]);

  // --- Section: Description (recommended overall) ---
  const description = scoreFields([
    { filled: descriptionLength >= 50, required: true },
    { filled: Boolean(property.short_description), required: false },
  ]);

  // --- Section: Amenities (recommended overall) ---
  const amenitiesSection = scoreFields([
    { filled: amenityCount >= 1, required: true },
    { filled: amenityCount >= 10, required: false },
  ]);

  // --- Section: House Rules (recommended overall) ---
  const houseRules = scoreFields([
    { filled: Boolean(property.check_in_time), required: true },
    { filled: Boolean(property.check_out_time), required: true },
    { filled: ruleKeys.has("smoking"), required: false },
    { filled: ruleKeys.has("pets"), required: false },
    { filled: ruleKeys.has("parties"), required: false },
  ]);

  // --- Section: Pricing ---
  const pricing_ = scoreFields([
    { filled: Boolean(pricing?.base_price), required: true },
  ]);

  // --- Section: Availability ---
  const availability = scoreFields([
    { filled: Boolean(settings), required: true },
    { filled: Boolean(settings?.min_stay_nights), required: false },
    { filled: Boolean(settings?.max_stay_nights), required: false },
  ]);

  // --- Section: Guest Requirements (recommended overall) ---
  const guestRequirements = scoreFields([{ filled: Boolean(settings), required: true }]);

  const sectionDefs: { key: SectionKey; label: string; description: string; required: boolean; result: ReturnType<typeof scoreFields> }[] = [
    { key: "basics", label: "Property Basics", description: "Property type, guest capacity, bedrooms, beds and bathrooms.", required: true, result: basics },
    { key: "location", label: "Location", description: "Address, map location, and guest visibility.", required: true, result: location },
    { key: "photos", label: "Photos", description: "Upload photos of your property, and set a cover photo.", required: true, result: photosSection },
    { key: "videos", label: "Video Tour", description: "Upload a walkthrough video, drone view, or virtual tour.", required: false, result: videosSection },
    { key: "title", label: "Title", description: "Create a title that stands out.", required: true, result: title },
    { key: "description", label: "Description", description: "About this place, guest access, neighborhood & more.", required: false, result: description },
    { key: "amenities", label: "Amenities", description: "Select all amenities available at your property.", required: false, result: amenitiesSection },
    { key: "houseRules", label: "House Rules", description: "Set expectations for your guests.", required: false, result: houseRules },
    { key: "pricing", label: "Pricing", description: "Set your pricing, fees and discounts.", required: true, result: pricing_ },
    { key: "availability", label: "Availability", description: "Set availability, minimum stay and more.", required: true, result: availability },
    { key: "guestRequirements", label: "Guest Requirements", description: "Set guest requirements and booking preferences.", required: false, result: guestRequirements },
  ];

  const sections: SectionCompletion[] = sectionDefs.map((s) => ({
    key: s.key,
    label: s.label,
    description: s.description,
    completionPercent: s.result.percent,
    status: statusFor(s.result.percent, s.result.allRequiredFilled),
    fieldsCompleted: s.result.completed,
    fieldsTotal: s.result.total,
    required: s.required,
    allRequiredFieldsFilled: s.result.allRequiredFilled,
  }));

  const requiredSections = sections.filter((s) => s.required);
  const recommendedSections = sections.filter((s) => !s.required);
  const requiredWeight = 1.5;
  const recommendedWeight = 1;
  const totalWeight = requiredSections.length * requiredWeight + recommendedSections.length * recommendedWeight;
  const weightedSum =
    requiredSections.reduce((sum, s) => sum + s.completionPercent * requiredWeight, 0) +
    recommendedSections.reduce((sum, s) => sum + s.completionPercent * recommendedWeight, 0);
  const overallCompletionPercent = Math.round(weightedSum / totalWeight);

  // The publish gate keys off allRequiredFieldsFilled, not completionPercent
  // === 100 — a required section can still carry an optional field (e.g.
  // Photos' "20+ photos" bonus) that legitimately keeps its display
  // percentage below 100 even once everything that actually blocks
  // publishing is done.
  const requiredRemaining = requiredSections.filter((s) => !s.allRequiredFieldsFilled).length;
  const recommendedRemaining = recommendedSections.filter((s) => s.completionPercent < 100).length;
  const missingRequiredLabels = requiredSections.filter((s) => !s.allRequiredFieldsFilled).map((s) => s.label);
  const canPublish = requiredRemaining === 0;

  // Estimated time: ~1.5 min per incomplete required field, ~0.75 min per incomplete recommended field.
  const incompleteRequiredFields = requiredSections.reduce((sum, s) => sum + (s.fieldsTotal - s.fieldsCompleted), 0);
  const incompleteRecommendedFields = recommendedSections.reduce((sum, s) => sum + (s.fieldsTotal - s.fieldsCompleted), 0);
  const estimatedMinutesRemaining = Math.max(0, Math.round(incompleteRequiredFields * 1.5 + incompleteRecommendedFields * 0.75));

  // --- Readiness Score (distinct from completion — docs §7) ---
  const photoReadiness = Math.min((photoCount / 20) * 70, 70) + (hasCover ? 30 : 0);
  const pricingReadiness = (pricing?.base_price ? 50 : 0) + (pricing?.weekend_price ? 25 : 0) + (pricing?.cleaning_fee ? 25 : 0);
  const descriptionReadiness = Math.min((descriptionLength / 200) * 100, 100);
  const amenitiesReadiness = Math.min((amenityCount / 15) * 100, 100);
  const availabilityReadiness = settings ? 100 : 0;
  const basicInfoReadiness = basics.percent;

  const readinessBreakdown = [
    { label: "Photos", percent: Math.round(photoReadiness) },
    { label: "Pricing", percent: Math.round(pricingReadiness) },
    { label: "Description", percent: Math.round(descriptionReadiness) },
    { label: "Amenities", percent: Math.round(amenitiesReadiness) },
    { label: "Availability", percent: Math.round(availabilityReadiness) },
    { label: "Basic Information", percent: Math.round(basicInfoReadiness) },
  ];

  const weights: Record<string, number> = {
    Photos: 25,
    Pricing: 20,
    Description: 15,
    Amenities: 15,
    Availability: 15,
    "Basic Information": 10,
  };
  const readinessScore = Math.round(readinessBreakdown.reduce((sum, r) => sum + (r.percent / 100) * weights[r.label], 0));

  // --- AI Property Coach (rule-based, docs §9) ---
  const coach: CoachRecommendation[] = [];
  if (!hasCover) {
    coach.push({ priority: "high", reason: "No cover photo is set.", action: "Choose a cover photo — it's the first thing guests see." });
  }
  if (photoCount < 20) {
    coach.push({
      priority: "medium",
      reason: `Only ${photoCount} photo${photoCount === 1 ? "" : "s"} uploaded.`,
      action: `Add ${20 - photoCount} more photos — listings with 20+ photos convert noticeably better.`,
    });
  }
  if (pricing && !pricing.weekend_price) {
    coach.push({
      priority: "medium",
      reason: "Weekend pricing hasn't been set.",
      action: "Add a weekend rate — you may be leaving weekend revenue on the table.",
    });
  }
  if (descriptionLength < 200) {
    coach.push({
      priority: "low",
      reason: "Your description is shorter than most successful listings.",
      action: "Add more detail about the space, guest access, and neighborhood.",
    });
  }
  if (amenityCount < 10) {
    coach.push({
      priority: "low",
      reason: "Fewer than 10 amenities selected.",
      action: "Guests frequently filter by amenities — add any you missed.",
    });
  }

  return {
    propertyId: property.id,
    propertyName: property.name,
    sections,
    overallCompletionPercent,
    requiredRemaining,
    recommendedRemaining,
    estimatedMinutesRemaining,
    readinessScore,
    readinessBreakdown,
    coach,
    canPublish,
    missingRequiredLabels,
    lastEditedAt: property.updated_at,
  };
}
