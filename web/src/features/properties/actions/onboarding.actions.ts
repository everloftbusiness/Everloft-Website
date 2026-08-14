"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSession } from "@/lib/dashboard/session";
import { uploadFile, computeChecksum, deleteObject, BUCKETS, type Bucket } from "@/lib/storage/r2";
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
  categoryId: z.string().uuid().optional().or(z.literal("")).or(z.literal("none")),
  maxGuests: z.coerce.number().int().min(1),
  bedrooms: z.coerce.number().int().min(1).default(1),
  bathrooms: z.coerce.number().int().min(1).default(1),
});

export async function saveBasicsAction(propertyId: string, formData: FormData) {
  const session = await requireEditAccess(propertyId);
  const input = basicsSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = await createClient();
  const categoryId = input.categoryId && input.categoryId !== "none" ? input.categoryId : null;
  const { error } = await supabase
    .from("properties")
    .update({
      type_id: input.typeId,
      category_id: categoryId,
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
  country: z.string().min(1).default("India"),
  state: z.string().optional().or(z.literal("")),
  city: z.string().min(1),
  address: z.string().min(1),
  pinCode: z.string().optional().or(z.literal("")),
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
      country: input.country || "India",
      state: input.state || null,
      city: input.city,
      address: input.address,
      pin_code: input.pinCode || null,
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

// --- Google Maps Resolution & Reverse Geocoding ---
export type ResolvedLocation = {
  address: string;
  city: string;
  state: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  displayName: string;
};

export async function resolveGoogleMapLocationAction(input: string): Promise<ResolvedLocation | null> {
  let url = input.trim();
  if (!url) return null;

  // 1. Follow short link redirect if applicable (maps.app.goo.gl or goo.gl/maps)
  if (url.includes("goo.gl") || url.includes("maps.app.goo.gl")) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      url = res.url;
      // If the URL didn't contain coordinates directly, check if HTML body contains meta search query
      if (!url.includes("search/") && !url.includes("@")) {
        const text = await res.text();
        const bodyMatch = text.match(/q=(-?\d+\.\d+)%2C\+?(-?\d+\.\d+)/);
        if (bodyMatch) {
          return await reverseGeocodeCoordsAction(parseFloat(bodyMatch[1]), parseFloat(bodyMatch[2]));
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Extract Coordinates from URL patterns
  const m1 = url.match(/(?:search\/|@|q=|\?ll=)(-?\d+\.\d+)[,\s+]+(-?\d+\.\d+)/);
  const m2 = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const m3 = url.match(/(-?\d+\.\d{3,})\s*,\s*(-?\d+\.\d{3,})/);

  let lat: number | null = null;
  let lng: number | null = null;

  if (m1) {
    lat = parseFloat(m1[1]);
    lng = parseFloat(m1[2]);
  } else if (m2) {
    lat = parseFloat(m2[1]);
    lng = parseFloat(m2[2]);
  } else if (m3) {
    lat = parseFloat(m3[1]);
    lng = parseFloat(m3[2]);
  }

  if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
    return await reverseGeocodeCoordsAction(lat, lng);
  }

  // Fallback: Check if place name is in URL (e.g. /maps/place/Name)
  const placeMatch = url.match(/\/maps\/place\/([^/@?]+)/);
  const searchQuery = placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, " ")) : url;

  try {
    const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=1`;
    const res = await fetch(searchUrl, { headers: { "User-Agent": "Everloft-App/1.0" } });
    const data = await res.json();
    if (data && data.length > 0) {
      const item = data[0];
      return await reverseGeocodeCoordsAction(parseFloat(item.lat), parseFloat(item.lon));
    }
  } catch {
    // ignore
  }

  return null;
}

export async function reverseGeocodeCoordsAction(lat: number, lng: number): Promise<ResolvedLocation> {
  let address = "";
  let city = "";
  let state = "Karnataka";
  let pinCode = "";
  let displayName = "";

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { "User-Agent": "Everloft-App/1.0" } }
    );
    const data = await res.json();
    if (data && data.address) {
      const a = data.address;
      displayName = data.display_name || "";
      pinCode = a.postcode || "";

      // Address components
      const streetParts = [
        a.building,
        a.house_number,
        a.road,
        a.suburb,
        a.neighbourhood,
        a.residential,
        a.village,
      ].filter(Boolean);
      address = streetParts.length > 0 ? streetParts.join(", ") : (data.name || "");

      // City normalization
      const rawCity = a.city || a.town || a.municipality || a.city_district || a.state_district || a.county || "";
      if (rawCity.toLowerCase().includes("bengaluru") || rawCity.toLowerCase().includes("bangalore")) {
        city = "Bangalore";
      } else {
        city = rawCity.replace(/District|Urban|Rural|South|North|East|West/gi, "").trim() || rawCity;
      }

      // State normalization
      if (a.state) {
        state = a.state;
      }
    }
  } catch {
    // fallback
  }

  return {
    address: address || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    city: city || "Bangalore",
    state: state || "Karnataka",
    pinCode: pinCode || "",
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lng.toFixed(6)),
    googleMapsUrl: `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`,
    displayName: displayName || `${city}, ${state}`,
  };
}

// --- Location Search Autocomplete Suggestions ---
export type LocationSuggestion = {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  distanceLabel?: string;
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function searchLocationSuggestionsAction(
  query: string,
  currentLat?: number,
  currentLng?: number
): Promise<LocationSuggestion[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const biasLat = currentLat ?? 12.9715987;
  const biasLng = currentLng ?? 77.5945627;

  // If query is a URL or coordinates, resolve directly
  if (q.includes("http") || q.includes("goo.gl") || q.includes("maps") || q.match(/\d+\.\d+,\s*\d+\.\d+/)) {
    const resolved = await resolveGoogleMapLocationAction(q);
    if (resolved) {
      return [
        {
          id: "resolved_url",
          title: resolved.address || "Google Maps Location",
          subtitle: `${resolved.city}, ${resolved.state} (${resolved.pinCode || "India"})`,
          lat: resolved.latitude,
          lng: resolved.longitude,
          distanceLabel: "Exact Pin Link",
        },
      ];
    }
  }

  const results: LocationSuggestion[] = [];
  const seenCoords = new Set<string>();

  function addResult(title: string, subtitle: string, lat: number, lng: number) {
    if (isNaN(lat) || isNaN(lng)) return;
    // Strict India Territorial Boundary: Lat 6.5 to 37.5, Lng 68.0 to 97.5
    if (lat < 6.5 || lat > 37.5 || lng < 68.0 || lng > 97.5) return;

    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (seenCoords.has(key)) return;
    seenCoords.add(key);

    const dist = calculateDistanceKm(biasLat, biasLng, lat, lng);
    const distRounded = Math.round(dist * 10) / 10;
    const distanceLabel = distRounded < 1 ? "< 1 km away" : distRounded < 100 ? `~${distRounded} km away` : "";

    results.push({
      id: `${key}_${results.length}`,
      title: title || "Location",
      subtitle: subtitle || "",
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      distanceKm: distRounded,
      distanceLabel,
    });
  }

  // Parallel query Photon (with proximity bias) and Nominatim (India countrycodes)
  const [photonRes, nominatimRes] = await Promise.allSettled([
    fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${biasLat}&lon=${biasLng}&limit=8`
    ).then((r) => r.json()),
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=in&format=json&addressdetails=1&limit=6`,
      { headers: { "User-Agent": "Everloft-App/1.0" } }
    ).then((r) => r.json()),
  ]);

  if (photonRes.status === "fulfilled" && photonRes.value?.features) {
    for (const f of photonRes.value.features) {
      const p = f.properties;
      const country = (p.country || "").toLowerCase();
      // Ensure country is India or within boundaries
      if (country && !country.includes("india")) continue;

      const title = p.name || p.street || p.city || "Location";
      const subtitle = [p.district, p.city, p.state, "India"].filter(Boolean).join(", ");
      addResult(title, subtitle, f.geometry.coordinates[1], f.geometry.coordinates[0]);
    }
  }

  if (nominatimRes.status === "fulfilled" && Array.isArray(nominatimRes.value)) {
    for (const item of nominatimRes.value) {
      const parts = item.display_name.split(",");
      const title = parts[0]?.trim() || item.name || "Location";
      const subtitle = parts.slice(1, 4).join(",").trim();
      addResult(title, subtitle, parseFloat(item.lat), parseFloat(item.lon));
    }
  }

  // Fallback: If 0 results, try searching subquery combinations (e.g. "astha siddhi", "ashta siddhi")
  if (results.length === 0 && q.includes(" ")) {
    const words = q.split(/\s+/).filter((w) => w.length > 2);
    if (words.length > 1) {
      const subQuery = words.slice(0, 2).join(" ");
      try {
        const subRes = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(subQuery)}&lat=${biasLat}&lon=${biasLng}&limit=5`
        ).then((r) => r.json());
        if (subRes && subRes.features) {
          for (const f of subRes.features) {
            const p = f.properties;
            const country = (p.country || "").toLowerCase();
            if (country && !country.includes("india")) continue;
            const title = p.name || p.street || p.city || "Location";
            const subtitle = [p.district, p.city, p.state, "India"].filter(Boolean).join(", ");
            addResult(title, subtitle, f.geometry.coordinates[1], f.geometry.coordinates[0]);
          }
        }
      } catch {
        // ignore
      }
    }
  }

  // Sort by closest distance to current map position
  results.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));

  return results.slice(0, 6);
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

export async function addCustomAmenityAction(propertyId: string, name: string, category = "entertainment") {
  const session = await requireEditAccess(propertyId);
  const supabase = await createClient();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 50);

  // Check if amenity exists in amenity_master
  let amenityId: string | null = null;
  const { data: existing } = await supabase.from("amenity_master").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    amenityId = existing.id;
  } else {
    // Insert into amenity_master
    const { data: created, error: createError } = await supabase
      .from("amenity_master")
      .insert({
        slug,
        name,
        category,
        sort_order: 9999,
        created_by: session.userId,
        updated_by: session.userId,
      })
      .select("id")
      .maybeSingle();

    if (!createError && created) {
      amenityId = created.id;
    }
  }

  // Link to property_amenities if amenityId resolved
  if (amenityId) {
    await supabase.from("property_amenities").insert({
      property_id: propertyId,
      amenity_id: amenityId,
      created_by: session.userId,
      updated_by: session.userId,
    });
  } else {
    // Fallback: save as custom_amenity rule
    await supabase.from("property_rules").insert({
      property_id: propertyId,
      rule_key: "custom_amenity",
      rule_text: name,
      created_by: session.userId,
      updated_by: session.userId,
    });
  }

  revalidate(propertyId);
  return { ok: true };
}

export async function deleteCustomAmenityAction(propertyId: string, amenityIdOrName: string) {
  const session = await requireEditAccess(propertyId);
  const supabase = await createClient();

  // If amenityIdOrName is in property_rules (custom_amenity)
  const nameTrimmed = amenityIdOrName.replace(/^custom_rule_/, "").trim();
  await supabase
    .from("property_rules")
    .delete()
    .eq("property_id", propertyId)
    .eq("rule_key", "custom_amenity")
    .eq("rule_text", nameTrimmed);

  // If it is an amenity_id in property_amenities
  if (z.string().uuid().safeParse(amenityIdOrName).success) {
    await supabase
      .from("property_amenities")
      .delete()
      .eq("property_id", propertyId)
      .eq("amenity_id", amenityIdOrName);
  }

  revalidate(propertyId);
  return { ok: true };
}

export async function saveCustomSpacesAction(propertyId: string, customSpaces: string[]) {
  const session = await requireEditAccess(propertyId);
  const supabase = await createClient();

  await supabase
    .from("property_rules")
    .delete()
    .eq("property_id", propertyId)
    .eq("rule_key", "custom_spaces");

  if (customSpaces.length > 0) {
    await supabase.from("property_rules").insert({
      property_id: propertyId,
      rule_key: "custom_spaces",
      rule_text: JSON.stringify(customSpaces),
      created_by: session.userId,
      updated_by: session.userId,
    });
  }

  revalidate(propertyId);
  return { ok: true };
}

export async function deleteCustomSpaceAction(propertyId: string, spaceName: string) {
  const session = await requireEditAccess(propertyId);
  const supabase = await createClient();

  // 1. Fetch existing custom_spaces rule
  const { data: rule } = await supabase
    .from("property_rules")
    .select("rule_text")
    .eq("property_id", propertyId)
    .eq("rule_key", "custom_spaces")
    .maybeSingle();

  let list: string[] = [];
  if (rule?.rule_text) {
    try {
      list = JSON.parse(rule.rule_text);
    } catch {}
  }
  const nextList = list.filter((s) => s !== spaceName);

  await supabase
    .from("property_rules")
    .delete()
    .eq("property_id", propertyId)
    .eq("rule_key", "custom_spaces");

  if (nextList.length > 0) {
    await supabase.from("property_rules").insert({
      property_id: propertyId,
      rule_key: "custom_spaces",
      rule_text: JSON.stringify(nextList),
      created_by: session.userId,
      updated_by: session.userId,
    });
  }

  // 2. Reassign any photos with this spaceTag to "Living Room"
  const { data: photos } = await supabase
    .from("property_photos")
    .select("id, tags, caption")
    .eq("property_id", propertyId)
    .is("deleted_at", null);

  for (const photo of photos ?? []) {
    if ((photo.tags && photo.tags.includes(spaceName)) || photo.caption === spaceName) {
      await supabase
        .from("property_photos")
        .update({
          tags: ["Living Room"],
          updated_by: session.userId,
        })
        .eq("id", photo.id);
    }
  }

  revalidate(propertyId);
  return { ok: true };
}

export async function saveRoomSpecsAction(propertyId: string, specs: import("@/features/properties/types/property.types").PropertyRoomSpecs) {
  const session = await requireEditAccess(propertyId);
  const supabase = await createClient();

  // Delete previous room_specs
  await supabase.from("property_rules").delete().eq("property_id", propertyId).eq("rule_key", "room_specs");

  // Insert updated room_specs
  const { error } = await supabase.from("property_rules").insert({
    property_id: propertyId,
    rule_key: "room_specs",
    rule_text: JSON.stringify(specs),
    created_by: session.userId,
    updated_by: session.userId,
  });
  if (error) throw error;

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

  const spaceTag = (formData.get("spaceTag") as string) || "Living Room";
  const caption = (formData.get("caption") as string) || null;
  const isCover = formData.get("isCover") === "true";

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

  const { data: newPhotoId, error } = await supabase.rpc("create_property_photo", {
    p_property_id: propertyId,
    p_file_id: fileRow.id,
    p_sort_order: count ?? 0,
  });
  if (error) throw error;

  // Update spaceTag in tags and caption
  if (newPhotoId) {
    await supabase
      .from("property_photos")
      .update({
        tags: [spaceTag],
        caption: caption,
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
  }

  revalidate(propertyId);
  return { ok: true };
}

export async function updatePropertyPhotoAction(
  propertyId: string,
  propertyPhotoId: string,
  data: { spaceTag?: string; caption?: string | null; isCover?: boolean }
) {
  const session = await requireEditAccess(propertyId);
  const supabase = await createClient();

  if (data.isCover) {
    await supabase.from("property_photos").update({ is_cover: false, updated_by: session.userId }).eq("property_id", propertyId);
  }

  const patch: { updated_by: string; tags?: string[]; caption?: string | null; is_cover?: boolean } = {
    updated_by: session.userId,
  };
  if (data.spaceTag !== undefined) patch.tags = [data.spaceTag];
  if (data.caption !== undefined) patch.caption = data.caption;
  if (data.isCover !== undefined) patch.is_cover = data.isCover;

  const { error } = await supabase.from("property_photos").update(patch).eq("id", propertyPhotoId);
  if (error) throw error;

  revalidate(propertyId);
  return { ok: true };
}

export async function reorderPropertyPhotosAction(propertyId: string, photoIds: string[]) {
  const session = await requireEditAccess(propertyId);
  const supabase = await createClient();

  await Promise.all(
    photoIds.map((id, index) =>
      supabase
        .from("property_photos")
        .update({ sort_order: index, updated_by: session.userId })
        .eq("id", id)
        .eq("property_id", propertyId)
    )
  );

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

  // 1. Fetch photo info including file_id and is_cover
  const { data: photo } = await supabase
    .from("property_photos")
    .select("id, file_id, is_cover, property_id")
    .eq("id", propertyPhotoId)
    .single();

  // 2. Mark property_photos record deleted
  const { error } = await supabase
    .from("property_photos")
    .update({ deleted_at: new Date().toISOString(), updated_by: session.userId })
    .eq("id", propertyPhotoId);
  if (error) throw error;

  // 3. Mark the linked file in files table deleted & clean physical storage
  if (photo?.file_id) {
    const { data: fileRow } = await supabase
      .from("files")
      .select("id, bucket, object_key, thumbnail_key")
      .eq("id", photo.file_id)
      .single();

    await supabase
      .from("files")
      .update({ deleted_at: new Date().toISOString(), updated_by: session.userId })
      .eq("id", photo.file_id);

    if (fileRow?.bucket && fileRow?.object_key) {
      try {
        await deleteObject(fileRow.bucket as Bucket, fileRow.object_key);
        if (fileRow.thumbnail_key) {
          await deleteObject(fileRow.bucket as Bucket, fileRow.thumbnail_key);
        }
      } catch (storageErr) {
        console.warn("Storage deletion note:", storageErr);
      }
    }
  }

  // 4. If this was the cover photo, automatically promote the next active photo as cover
  if (photo?.is_cover) {
    const { data: nextPhotos } = await supabase
      .from("property_photos")
      .select("id")
      .eq("property_id", propertyId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .limit(1);

    if (nextPhotos && nextPhotos.length > 0) {
      await supabase
        .from("property_photos")
        .update({ is_cover: true, updated_by: session.userId })
        .eq("id", nextPhotos[0].id);
    }
  }

  revalidate(propertyId);
  return { ok: true };
}

// --- Videos ---
export async function uploadPropertyVideoAction(propertyId: string, formData: FormData) {
  const session = await requireEditAccess(propertyId);
  const file = formData.get("file");
  const videoType = (formData.get("videoType") as string) || "walkthrough";
  const caption = (formData.get("caption") as string) || null;
  if (!(file instanceof File)) throw new Error("A video file is required.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const objectKey = `${session.userId}/${randomUUID()}-${file.name}`;
  const checksum = computeChecksum(buffer);
  const uploaded = await uploadFile({
    bucket: BUCKETS.propertyVideos,
    key: objectKey,
    body: buffer,
    contentType: file.type || "video/mp4",
    makePublic: true,
    generateDerivatives: false,
  });
  const fileRow = await createFileRecord({
    bucket: uploaded.bucket,
    objectKey: uploaded.key,
    originalName: file.name,
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
  const { count, error: countError } = await supabase
    .from("property_videos")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId)
    .is("deleted_at", null);
  if (countError) throw countError;

  const { error: insertError } = await supabase.from("property_videos").insert({
    property_id: propertyId,
    file_id: fileRow.id,
    video_type: videoType,
    caption,
    sort_order: count ?? 0,
    created_by: session.userId,
    updated_by: session.userId,
  });
  if (insertError) throw insertError;

  revalidate(propertyId);
  return { ok: true };
}

export async function removePropertyVideoAction(propertyId: string, videoId: string) {
  const session = await requireEditAccess(propertyId);
  const supabase = await createClient();

  const { data: video } = await supabase
    .from("property_videos")
    .select("id, file_id")
    .eq("id", videoId)
    .single();

  const { error } = await supabase
    .from("property_videos")
    .update({ deleted_at: new Date().toISOString(), updated_by: session.userId })
    .eq("id", videoId);
  if (error) throw error;

  if (video?.file_id) {
    const { data: fileRow } = await supabase
      .from("files")
      .select("id, bucket, object_key")
      .eq("id", video.file_id)
      .single();

    await supabase
      .from("files")
      .update({ deleted_at: new Date().toISOString(), updated_by: session.userId })
      .eq("id", video.file_id);

    if (fileRow?.bucket && fileRow?.object_key) {
      try {
        await deleteObject(fileRow.bucket as Bucket, fileRow.object_key);
      } catch (storageErr) {
        console.warn("Storage deletion note:", storageErr);
      }
    }
  }

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
