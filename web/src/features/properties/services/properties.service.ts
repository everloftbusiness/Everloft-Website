import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSignedDownloadUrl, type Bucket } from "@/lib/storage/r2";
import type { Database } from "@/lib/supabase/types";
import type {
  PropertyListItem,
  PropertyDetail,
  LookupOption,
  OwnerOption,
  PublicPropertyListItem,
  PublicPropertyDetail,
} from "@/features/properties/types/property.types";

type PropertiesUpdate = Database["public"]["Tables"]["properties"]["Update"];

/**
 * Guest-facing collection for the marketing site. The service role is used
 * deliberately because public visitors have no Supabase session and RLS keeps
 * operational property/file data private. This function selects only active
 * listings and the small set of display-safe fields below.
 */
export async function listPublicActiveProperties(limit = 6): Promise<PublicPropertyListItem[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];

  const supabase = createAdminClient();
  const { data: activeStatus, error: statusError } = await supabase
    .from("property_status")
    .select("id")
    .eq("slug", "active")
    .maybeSingle();
  if (statusError) throw statusError;
  if (!activeStatus) return [];

  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select("id, slug, name, city, area, type_id, bedrooms, bathrooms, max_guests, currency, latitude, longitude")
    .eq("status_id", activeStatus.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (propertiesError) throw propertiesError;
  if (!properties?.length) return [];

  const propertyIds = properties.map((property) => property.id);
  const typeIds = [...new Set(properties.map((property) => property.type_id).filter((id): id is string => Boolean(id)))];
  const [{ data: types, error: typesError }, { data: pricing, error: pricingError }, { data: photos, error: photosError }] = await Promise.all([
    typeIds.length > 0
      ? supabase.from("property_types").select("id, name").in("id", typeIds)
      : Promise.resolve({ data: [], error: null }),
    // property_pricing is a one-to-one rate card and has no soft-delete column.
    supabase.from("property_pricing").select("property_id, base_price").in("property_id", propertyIds),
    supabase
      .from("property_photos")
      .select("property_id, file_id, is_cover, sort_order")
      .in("property_id", propertyIds)
      .is("deleted_at", null)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true }),
  ]);
  if (typesError) throw typesError;
  if (pricingError) throw pricingError;
  if (photosError) throw photosError;

  const typeNames = new Map((types ?? []).map((t) => [t.id, t.name]));
  const prices = new Map((pricing ?? []).map((rate) => [rate.property_id, rate.base_price ? Number(rate.base_price) : null]));
  const coverFileByProperty = new Map<string, string>();
  for (const photo of photos ?? []) {
    if (!coverFileByProperty.has(photo.property_id) || photo.is_cover) {
      coverFileByProperty.set(photo.property_id, photo.file_id);
    }
  }

  const uniqueCoverFileIds = [...new Set(Array.from(coverFileByProperty.values()))];
  const { data: files } = uniqueCoverFileIds.length
    ? await supabase.from("files").select("id, public_url, bucket, object_key, thumbnail_key").in("id", uniqueCoverFileIds)
    : { data: [] };

  const filesById = new Map(
    await Promise.all(
      (files ?? []).map(async (file) => {
        let coverUrl: string | null = file.public_url || null;
        let thumbUrl: string | null = null;

        if (!coverUrl) {
          const publicBase = process.env.R2_PUBLIC_BASE_URL || "https://pub-ceafc7e3144f4cf0be1a828c0ec9f85c.r2.dev";
          coverUrl = `${publicBase.replace(/\/$/, "")}/${file.bucket}/${file.object_key}`;
        }

        if (file.thumbnail_key) {
          if (file.public_url && file.object_key) {
            thumbUrl = file.public_url.replace(file.object_key, file.thumbnail_key);
          } else {
            const publicBase = process.env.R2_PUBLIC_BASE_URL || "https://pub-ceafc7e3144f4cf0be1a828c0ec9f85c.r2.dev";
            thumbUrl = `${publicBase.replace(/\/$/, "")}/${file.bucket}/${file.thumbnail_key}`;
          }
        }

        return [file.id, { coverUrl, thumbUrl: thumbUrl || coverUrl }] as const;
      })
    )
  );

  return properties.map((property) => {
    const fileId = coverFileByProperty.get(property.id);
    const fileInfo = fileId ? filesById.get(fileId) : null;
    const coverUrl = fileInfo?.coverUrl ?? null;
    const thumbUrl = fileInfo?.thumbUrl ?? fileInfo?.coverUrl ?? null;

    return {
      id: property.id,
      slug: property.slug,
      name: property.name,
      city: property.city,
      area: property.area,
      typeName: property.type_id ? (typeNames.get(property.type_id) ?? null) : null,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      maxGuests: property.max_guests,
      currency: property.currency,
      nightlyPrice: prices.get(property.id) ?? null,
      coverImageUrl: coverUrl,
      thumbnailUrl: thumbUrl,
      latitude: property.latitude ? Number(property.latitude) : null,
      longitude: property.longitude ? Number(property.longitude) : null,
    };
  });
}

export async function getPublicActivePropertyBySlug(slug: string): Promise<PublicPropertyDetail | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const supabase = createAdminClient();
  const { data: activeStatus, error: statusError } = await supabase
    .from("property_status")
    .select("id")
    .eq("slug", "active")
    .maybeSingle();
  if (statusError) throw statusError;
  if (!activeStatus) return null;

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, slug, name, city, area, address, state, country, pin_code, latitude, longitude, google_maps_url, description, highlights, property_area_sqft, type_id, bedrooms, bathrooms, max_guests, currency, check_in_time, check_out_time")
    .eq("slug", slug)
    .eq("status_id", activeStatus.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (propertyError) throw propertyError;
  if (!property) return null;

  const [
    { data: type, error: typeError },
    { data: pricing, error: pricingError },
    { data: amenityRows, error: amenitiesError },
    { data: photoRows, error: photosError },
    { data: videoRows, error: videosError },
    { data: ruleRows, error: rulesError },
  ] = await Promise.all([
    property.type_id ? supabase.from("property_types").select("name").eq("id", property.type_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    supabase.from("property_pricing").select("base_price").eq("property_id", property.id).maybeSingle(),
    supabase.from("property_amenities").select("amenity_id").eq("property_id", property.id).is("deleted_at", null),
    supabase.from("property_photos").select("id, file_id, is_cover, sort_order, caption, tags").eq("property_id", property.id).is("deleted_at", null).order("sort_order"),
    supabase.from("property_videos").select("id, file_id, video_type, caption, sort_order").eq("property_id", property.id).is("deleted_at", null).order("sort_order"),
    supabase.from("property_rules").select("rule_key, rule_text").eq("property_id", property.id).is("deleted_at", null),
  ]);
  if (typeError) throw typeError;
  if (pricingError) throw pricingError;
  if (amenitiesError) throw amenitiesError;
  if (photosError) throw photosError;
  if (videosError) throw videosError;
  if (rulesError) throw rulesError;

  const amenityIds = (amenityRows ?? []).map((row) => row.amenity_id);
  const photoFileIds = (photoRows ?? []).map((row) => row.file_id);
  const videoFileIds = (videoRows ?? []).map((row) => row.file_id);
  const allFileIds = [...new Set([...photoFileIds, ...videoFileIds])];

  const [{ data: amenities, error: amenityNamesError }, { data: files, error: filesError }] = await Promise.all([
    amenityIds.length > 0 ? supabase.from("amenity_master").select("id, name").in("id", amenityIds).is("deleted_at", null) : Promise.resolve({ data: [], error: null }),
    allFileIds.length > 0 ? supabase.from("files").select("id, public_url, bucket, object_key").in("id", allFileIds).is("deleted_at", null) : Promise.resolve({ data: [], error: null }),
  ]);
  if (amenityNamesError) throw amenityNamesError;
  if (filesError) throw filesError;

  let roomSpecs: import("@/features/properties/types/property.types").PropertyRoomSpecs = {};
  const roomSpecsRule = (ruleRows ?? []).find((r) => r.rule_key === "room_specs");
  if (roomSpecsRule?.rule_text) {
    try {
      roomSpecs = JSON.parse(roomSpecsRule.rule_text);
    } catch {}
  }

  const customAmenityNames = (ruleRows ?? [])
    .filter((r) => r.rule_key === "custom_amenity")
    .map((r) => r.rule_text);

  const fileUrls = new Map((files ?? []).map((file) => [file.id, file.public_url]));

  const photos = (photoRows ?? [])
    .map((photo) => {
      const url = fileUrls.get(photo.file_id);
      if (!url) return null;
      const spaceTag = photo.tags && photo.tags.length > 0 ? photo.tags[0] : (photo.caption || "Living Room");
      return {
        id: photo.id,
        url,
        alt: photo.caption || `${property.name} - ${spaceTag}`,
        caption: photo.caption,
        spaceTag,
        isCover: photo.is_cover,
        sortOrder: photo.sort_order,
      };
    })
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const videos = (videoRows ?? [])
    .map((video) => {
      const url = fileUrls.get(video.file_id);
      if (!url) return null;
      return {
        id: video.id,
        url,
        videoType: video.video_type,
        caption: video.caption,
      };
    })
    .filter((v): v is { id: string; url: string; videoType: string; caption: string | null } => Boolean(v));

  const allAmenities = [
    ...(amenities ?? []).map((amenity) => amenity.name),
    ...customAmenityNames,
  ];

  return {
    id: property.id,
    slug: property.slug,
    name: property.name,
    city: property.city,
    area: property.area,
    state: property.state,
    country: property.country,
    pinCode: property.pin_code,
    latitude: property.latitude ? Number(property.latitude) : null,
    longitude: property.longitude ? Number(property.longitude) : null,
    googleMapsUrl: property.google_maps_url,
    typeName: type?.name ?? null,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    maxGuests: property.max_guests,
    currency: property.currency,
    nightlyPrice: pricing?.base_price ? Number(pricing.base_price) : null,
    coverImageUrl: photos[0]?.url ?? null,
    address: property.address,
    description: property.description,
    highlights: property.highlights ?? [],
    propertyAreaSqft: property.property_area_sqft,
    amenities: allAmenities,
    photos,
    videos,
    roomSpecs,
    checkInTime: property.check_in_time,
    checkOutTime: property.check_out_time,
    rules: (ruleRows ?? []).map((r) => ({ key: r.rule_key, text: r.rule_text })),
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(supabase: Awaited<ReturnType<typeof createClient>>, name: string): Promise<string> {
  const base = slugify(name) || "property";
  let candidate = base;
  let attempt = 0;
  while (true) {
    const { data } = await supabase.from("properties").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    attempt += 1;
    candidate = `${base}-${attempt + 1}`;
  }
}

async function describeOwners(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: { owner_id: string | null; managed_by: string | null }[]
) {
  const ids = [...new Set(rows.flatMap((r) => [r.owner_id, r.managed_by]).filter((id): id is string => Boolean(id)))];
  const map = new Map<string, string>();
  if (ids.length > 0) {
    const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
    for (const p of data ?? []) map.set(p.id, p.full_name || p.email || "Unknown");
  }
  return map;
}

export async function listProperties(filters: {
  search?: string;
  statusSlug?: string;
  typeId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ properties: PropertyListItem[]; total: number; page: number; pageSize: number }> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;

  try {
    const supabase = createAdminClient();

    const [{ data: types }, { data: statuses }] = await Promise.all([
      supabase.from("property_types").select("id, slug, name"),
      supabase.from("property_status").select("id, slug, name"),
    ]);
    const typeMap = new Map((types ?? []).map((t) => [t.id, t.name]));
    const statusMap = new Map((statuses ?? []).map((s) => [s.id, { slug: s.slug, name: s.name }]));

    let query = supabase
      .from("properties")
      .select("id, name, slug, internal_code, city, type_id, status_id, owner_id, managed_by, max_guests", {
        count: "exact",
      })
      .is("deleted_at", null);

    if (filters.search) query = query.ilike("name", `%${filters.search}%`);
    if (filters.typeId) query = query.eq("type_id", filters.typeId);
    if (filters.statusSlug) {
      const statusId = [...statusMap.entries()].find(([, v]) => v.slug === filters.statusSlug)?.[0];
      if (statusId) query = query.eq("status_id", statusId);
    }

    const from = (page - 1) * pageSize;
    const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
    if (error) {
      console.error("listProperties query error:", error);
      return { properties: [], total: 0, page, pageSize };
    }

    const propertyIds = (data ?? []).map((p) => p.id);

    const [{ data: photos }, { data: pricing }] = await Promise.all([
      propertyIds.length > 0
        ? supabase
            .from("property_photos")
            .select("property_id, file_id, is_cover")
            .in("property_id", propertyIds)
            .is("deleted_at", null)
            .order("is_cover", { ascending: false })
        : Promise.resolve({ data: [] }),
      propertyIds.length > 0
        ? supabase
            .from("property_pricing")
            .select("property_id, base_price")
            .in("property_id", propertyIds)
        : Promise.resolve({ data: [] }),
    ]);

    const coverFileIds = new Map<string, string>();
    for (const ph of photos ?? []) {
      if (!coverFileIds.has(ph.property_id) || ph.is_cover) {
        coverFileIds.set(ph.property_id, ph.file_id);
      }
    }

    const uniqueFileIds = [...new Set(Array.from(coverFileIds.values()))];
    const { data: files } = uniqueFileIds.length > 0
      ? await supabase.from("files").select("id, public_url, bucket, object_key").in("id", uniqueFileIds)
      : { data: [] };

    const fileUrlMap = new Map((files ?? []).map((f) => [f.id, f.public_url]));
    const pricingMap = new Map((pricing ?? []).map((pr) => [pr.property_id, Boolean(pr.base_price)]));
    const photoCountMap = new Map<string, number>();
    for (const ph of photos ?? []) {
      photoCountMap.set(ph.property_id, (photoCountMap.get(ph.property_id) || 0) + 1);
    }

    const ownerMap = await describeOwners(supabase, data ?? []);

    const properties: PropertyListItem[] = (data ?? []).map((row) => {
      const fileId = coverFileIds.get(row.id);
      const coverImageUrl = fileId ? fileUrlMap.get(fileId) ?? null : null;
      const hasPricing = pricingMap.get(row.id) ?? false;
      const hasPhotos = (photoCountMap.get(row.id) || 0) > 0;
      const hasBasics = Boolean(row.name && row.city && row.type_id);

      let completionScore = 0;
      if (hasBasics) completionScore += 30;
      if (hasPhotos) completionScore += 30;
      if (hasPricing) completionScore += 40;

      const rawStatusSlug = row.status_id ? (statusMap.get(row.status_id)?.slug ?? "draft") : "draft";
      let statusSlug = rawStatusSlug;
      let statusName = row.status_id ? (statusMap.get(row.status_id)?.name ?? "Draft") : "Draft";

      if (rawStatusSlug === "active" && completionScore < 100) {
        statusSlug = "draft";
        statusName = "Draft";
      }

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        internalCode: row.internal_code,
        city: row.city,
        typeName: row.type_id ? (typeMap.get(row.type_id) ?? null) : null,
        statusSlug,
        statusName,
        ownerName: row.owner_id ? (ownerMap.get(row.owner_id) ?? null) : null,
        managerName: row.managed_by ? (ownerMap.get(row.managed_by) ?? null) : null,
        maxGuests: row.max_guests,
        coverImageUrl,
        thumbnailUrl: coverImageUrl,
        completionScore,
      };
    });

    return { properties, total: count ?? 0, page, pageSize };
  } catch (err) {
    console.error("listProperties catch error:", err);
    return { properties: [], total: 0, page, pageSize };
  }
}

export async function getProperty(id: string): Promise<PropertyDetail | null> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase.from("properties").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const [{ data: type }, { data: status }, ownerMap] = await Promise.all([
    row.type_id ? supabase.from("property_types").select("name").eq("id", row.type_id).maybeSingle() : Promise.resolve({ data: null }),
    row.status_id
      ? supabase.from("property_status").select("slug, name").eq("id", row.status_id).maybeSingle()
      : Promise.resolve({ data: null }),
    describeOwners(supabase, [row]),
  ]);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    internalCode: row.internal_code,
    city: row.city,
    typeName: type?.name ?? null,
    statusSlug: status?.slug ?? null,
    statusName: status?.name ?? null,
    ownerName: row.owner_id ? (ownerMap.get(row.owner_id) ?? null) : null,
    managerName: row.managed_by ? (ownerMap.get(row.managed_by) ?? null) : null,
    maxGuests: row.max_guests,
    country: row.country,
    state: row.state,
    address: row.address,
    description: row.description,
    shortDescription: row.short_description,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    currency: row.currency,
    typeId: row.type_id,
    statusId: row.status_id,
    categoryId: row.category_id,
    ownerId: row.owner_id,
    managedBy: row.managed_by,
    createdAt: row.created_at,
  };
}

export async function getPropertyLookups(): Promise<{
  types: LookupOption[];
  statuses: LookupOption[];
  categories: LookupOption[];
}> {
  const supabase = createAdminClient();
  const [{ data: types }, { data: statuses }, { data: categories }] = await Promise.all([
    supabase.from("property_types").select("id, slug, name").order("sort_order"),
    supabase.from("property_status").select("id, slug, name").order("sort_order"),
    supabase.from("property_categories").select("id, slug, name").order("sort_order"),
  ]);
  return {
    types: (types ?? []) as LookupOption[],
    statuses: (statuses ?? []) as LookupOption[],
    categories: (categories ?? []) as LookupOption[],
  };
}

export async function getOwnerOptions(): Promise<OwnerOption[]> {
  const supabase = createAdminClient();
  const { data: role } = await supabase.from("roles").select("id").eq("slug", "property_owner").maybeSingle();
  if (!role) return [];

  const { data: assignments } = await supabase.from("user_roles").select("user_id").eq("role_id", role.id).is("deleted_at", null);
  const ownerIds = [...new Set((assignments ?? []).map((a) => a.user_id))];
  if (ownerIds.length === 0) return [];

  const { data: owners } = await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds);
  return (owners ?? []).map((o) => ({ id: o.id, name: o.full_name || o.email || "Unknown owner" }));
}

/**
 * Minimal "Add Property" entry point — just a name. Everything else
 * (type, location, specs, ...) is filled in through the Setup Dashboard
 * (docs/PROPERTY_ONBOARDING_EXPERIENCE.md), not a big form up front. All
 * other property columns are nullable precisely so this works.
 */
export async function createDraftProperty(name: string, userId: string): Promise<{ id: string }> {
  const supabase = createAdminClient();
  const slug = await uniqueSlug(supabase, name);

  const { data: draftStatus } = await supabase.from("property_status").select("id").eq("slug", "draft").maybeSingle();
  if (!draftStatus) throw new Error("draft status not found.");

  const { data, error } = await supabase
    .from("properties")
    .insert({
      name,
      slug,
      status_id: draftStatus.id,
      country: "India",
      timezone: "Asia/Kolkata",
      currency: "INR",
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { id: data.id };
}

export type CreatePropertyInput = {
  name: string;
  typeId: string;
  statusId: string;
  categoryId?: string;
  country: string;
  state?: string;
  city: string;
  address?: string;
  ownerId?: string;
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
  description?: string;
  currency?: string;
  timezone?: string;
};

export type UpdatePropertyInput = Partial<CreatePropertyInput>;

export async function updateProperty(id: string, input: UpdatePropertyInput, userId: string) {
  const supabase = createAdminClient();
  const patch: PropertiesUpdate = { updated_by: userId };
  if (input.name !== undefined) patch.name = input.name;
  if (input.typeId !== undefined) patch.type_id = input.typeId;
  if (input.statusId !== undefined) patch.status_id = input.statusId;
  if (input.categoryId !== undefined) patch.category_id = input.categoryId || null;
  if (input.country !== undefined) patch.country = input.country;
  if (input.state !== undefined) patch.state = input.state || null;
  if (input.city !== undefined) patch.city = input.city;
  if (input.address !== undefined) patch.address = input.address || null;
  if (input.ownerId !== undefined) patch.owner_id = input.ownerId || null;
  if (input.maxGuests !== undefined) patch.max_guests = input.maxGuests;
  if (input.bedrooms !== undefined) patch.bedrooms = input.bedrooms;
  if (input.bathrooms !== undefined) patch.bathrooms = input.bathrooms;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.currency !== undefined) patch.currency = input.currency;

  const { error } = await supabase.from("properties").update(patch).eq("id", id);
  if (error) throw error;
}

export async function softDeleteProperty(id: string, userId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("properties")
    .update({ deleted_at: new Date().toISOString(), updated_by: userId })
    .eq("id", id);
  if (error) throw error;
}
