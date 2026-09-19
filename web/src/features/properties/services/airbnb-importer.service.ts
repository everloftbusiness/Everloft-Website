import "server-only";

export type ExtractedAirbnbProperty = {
  url: string;
  roomId: string;
  name: string;
  description: string;
  shortDescription?: string;
  propertyType?: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  pinCode?: string;
  latitude?: number;
  longitude?: number;
  nightlyPrice?: number;
  currency?: string;
  photos: { url: string; caption?: string; spaceTag?: string }[];
  amenityNames: string[];
  houseRules: {
    checkIn?: string;
    checkOut?: string;
    petsAllowed?: boolean;
    smokingAllowed?: boolean;
    partiesAllowed?: boolean;
  };
};

/**
 * Extracts room ID from various Airbnb URL formats:
 * - https://www.airbnb.com/rooms/1755951932544627392
 * - https://www.airbnb.co.in/rooms/1127955898193951447
 * - https://www.airbnb.com/rooms/plus/12345678
 * - Short links (abnb.me)
 */
export function extractAirbnbRoomId(urlInput: string): string | null {
  const trimmed = urlInput.trim();
  const roomMatch = trimmed.match(/\/rooms\/(?:plus\/)?([0-9]+|[a-zA-Z0-9_-]+)/);
  if (roomMatch && roomMatch[1]) {
    return roomMatch[1];
  }
  return null;
}

/**
 * Clean property name by stripping host contact phone numbers, Airbnb suffixes, and invalid section names.
 */
function sanitizePropertyName(rawName: string): string {
  if (!rawName || typeof rawName !== "string") return "";

  let cleaned = rawName
    // Strip 10-digit Indian mobile numbers and international numbers
    .replace(/\b\d{10}\b/g, "")
    .replace(/\+?91[\s-]?\d{10}/g, "")
    .replace(/\b0\d{10}\b/g, "")
    // Strip trailing Airbnb brand markers
    .replace(/\s*-\s*Airbnb\s*$/i, "")
    .replace(/\s*·\s*Airbnb\s*$/i, "")
    .replace(/\s*\|\s*Airbnb\s*$/i, "")
    // Cleanup double commas or trailing punctuation
    .replace(/,\s*,/g, ",")
    .replace(/^[\s,-]+|[\s,-]+$/g, "")
    .trim();

  const invalidTitles = new Set([
    "not included",
    "home safety",
    "services",
    "location features",
    "airbnb",
    "unavailable",
    "property location",
  ]);

  if (invalidTitles.has(cleaned.toLowerCase())) {
    return "";
  }

  return cleaned;
}

/**
 * Normalizes verbose Airbnb amenity titles into clean Everloft canonical names, slugs and smart categories.
 */
export function normalizeAmenityName(rawName: string): { name: string; slug: string; category: string } {
  let name = rawName.trim();
  const lower = name.toLowerCase();

  if (/generator|diesel generator/i.test(lower)) return { name: "Generator", slug: "generator", category: "smart_home" };
  if (/power backup|power_backup|100% power backup/i.test(lower)) return { name: "Power Backup (100%)", slug: "power_backup", category: "smart_home" };
  if (/inverter|battery backup/i.test(lower)) return { name: "Inverter Backup", slug: "inverter_backup", category: "smart_home" };
  if (/ups|ups backup/i.test(lower)) return { name: "UPS Backup", slug: "ups_backup", category: "smart_home" };
  if (/solar|solar power|solar panels/i.test(lower)) return { name: "Solar Power System", slug: "solar_power", category: "smart_home" };
  if (/wifi|wi-fi|internet/i.test(lower)) return { name: "Wifi", slug: "wifi", category: "internet_office" };
  if (/dedicated workspace|workspace|office desk/i.test(lower)) return { name: "Dedicated Workspace", slug: "workspace", category: "internet_office" };
  if (/air conditioning|a\/c|ac\b/i.test(lower)) return { name: "Air Conditioning", slug: "air_conditioning", category: "heating_cooling" };
  if (/ceiling fan|fan\b/i.test(lower)) return { name: "Ceiling Fan", slug: "ceiling_fan", category: "heating_cooling" };
  if (/heating|heater/i.test(lower)) return { name: "Heating", slug: "heating", category: "heating_cooling" };
  if (/free parking|parking on premises|garage/i.test(lower)) return { name: "Free Parking", slug: "free_parking", category: "parking_building" };
  if (/ev charger/i.test(lower)) return { name: "EV Charger", slug: "ev_charger", category: "parking_building" };
  if (/lift|elevator/i.test(lower)) return { name: "Lift / Elevator", slug: "lift", category: "parking_building" };
  if (/building staff|caretaker|concierge/i.test(lower)) return { name: "Building Staff & Caretaker", slug: "building_staff", category: "guest_services" };
  if (/swimming pool|pool\b/i.test(lower)) return { name: "Swimming Pool", slug: "swimming_pool", category: "outdoor" };
  if (/washing machine|washer\b/i.test(lower)) return { name: "Washing Machine", slug: "washing_machine", category: "laundry" };
  if (/tumble dryer|clothes dryer|dryer\b/i.test(lower)) return { name: "Clothes Dryer", slug: "tumble_dryer", category: "laundry" };
  if (/iron\b|ironing board/i.test(lower)) return { name: "Iron & Board", slug: "iron", category: "laundry" };
  if (/clothes drying rack|drying rack/i.test(lower)) return { name: "Clothes Drying Rack", slug: "drying_rack", category: "laundry" };
  if (/clothes storage|wardrobe|closet/i.test(lower)) return { name: "Wardrobe & Closet", slug: "wardrobe", category: "bedroom" };
  if (/bed linen|bed sheets|linens/i.test(lower)) return { name: "Linen & Bed Sheets", slug: "bed_linen", category: "bedroom" };
  if (/shampoo/i.test(lower)) return { name: "Shampoo & Toiletries", slug: "shampoo", category: "bathroom" };
  if (/body soap|shower gel/i.test(lower)) return { name: "Body Soap & Shower Gel", slug: "body_soap", category: "bathroom" };
  if (/hairdryer|hair dryer/i.test(lower)) return { name: "Hairdryer", slug: "hairdryer", category: "bathroom" };
  if (/bidet/i.test(lower)) return { name: "Bidet", slug: "bidet", category: "bathroom" };
  if (/hot water|geyser/i.test(lower)) return { name: "Hot Water & Geyser", slug: "hot_water", category: "bathroom" };
  if (/kitchen\b|kitchenette/i.test(lower)) return { name: "Kitchen", slug: "kitchen", category: "kitchen_dining" };
  if (/cooking basics/i.test(lower)) return { name: "Cooking Basics (Pots, Pans, Oil)", slug: "cooking_basics", category: "kitchen_dining" };
  if (/crockery and cutlery|dishes and silverware/i.test(lower)) return { name: "Crockery & Cutlery", slug: "crockery_cutlery", category: "kitchen_dining" };
  if (/fridge|freezer|refrigerator/i.test(lower)) return { name: "Refrigerator & Freezer", slug: "refrigerator", category: "kitchen_dining" };
  if (/gas cooker|cooker|stove|oven/i.test(lower)) return { name: "Stove & Cooker", slug: "stove_cooker", category: "kitchen_dining" };
  if (/microwave/i.test(lower)) return { name: "Microwave", slug: "microwave", category: "kitchen_dining" };
  if (/dining table/i.test(lower)) return { name: "Dining Table", slug: "dining_table", category: "kitchen_dining" };
  if (/patio or balcony|balcony|terrace/i.test(lower)) return { name: "Balcony / Patio", slug: "balcony", category: "outdoor" };
  if (/garden|lawn|back garden/i.test(lower)) return { name: "Garden / Lawn", slug: "garden", category: "outdoor" };
  if (/tv\b|television|smart tv|hdtv/i.test(lower)) return { name: "Smart TV", slug: "tv", category: "entertainment" };
  if (/cinema|projector|home theatre/i.test(lower)) return { name: "Cinema & Projector", slug: "cinema", category: "entertainment" };
  if (/books and reading/i.test(lower)) return { name: "Books & Reading Material", slug: "books", category: "entertainment" };
  if (/exterior security cameras/i.test(lower)) return { name: "Exterior Security Cameras", slug: "security_cameras", category: "safety_security" };
  if (/gated community/i.test(lower)) return { name: "Gated Community", slug: "gated_community", category: "parking_building" };
  if (/private entrance/i.test(lower)) return { name: "Private Entrance", slug: "private_entrance", category: "parking_building" };
  if (/single-level home/i.test(lower)) return { name: "Single-Level Home", slug: "single_level_home", category: "parking_building" };
  if (/housekeeping/i.test(lower)) return { name: "Housekeeping Services", slug: "housekeeping", category: "guest_services" };
  if (/self check-in/i.test(lower)) return { name: "Self Check-in", slug: "self_check_in", category: "guest_services" };
  if (/long-term stays allowed/i.test(lower)) return { name: "Long-term Stays Allowed", slug: "long_term_stays", category: "guest_services" };

  let category = "essentials";
  if (/kitchen|cook|fridge|oven|stove|dish|dining|coffe/i.test(lower)) category = "kitchen_dining";
  else if (/bath|shower|soap|shampoo|towel|bidet|toilet/i.test(lower)) category = "bathroom";
  else if (/bed|pillow|blanket|linen|sheet|wardrobe|closet/i.test(lower)) category = "bedroom";
  else if (/wash|dryer|iron|laundry/i.test(lower)) category = "laundry";
  else if (/ac|cool|fan|heat|climate/i.test(lower)) category = "heating_cooling";
  else if (/park|garage|ev|lift|elevator|entrance|gate/i.test(lower)) category = "parking_building";
  else if (/garden|patio|balcony|pool|deck|outdoor|bbq/i.test(lower)) category = "outdoor";
  else if (/tv|game|music|book|cinema|speaker|audio/i.test(lower)) category = "entertainment";
  else if (/camera|safe|alarm|extinguisher|guard|lock/i.test(lower)) category = "safety_security";
  else if (/service|check-in|staff|chef|housekeep/i.test(lower)) category = "guest_services";
  else if (/wifi|net|office|desk|work/i.test(lower)) category = "internet_office";

  let cleanName = name.replace(/\s*–\s*.*$/g, "").replace(/\s*-\s*.*$/g, "").trim();
  if (cleanName.length < 3) cleanName = name;
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 50);

  return { name: cleanName, slug, category };
}

/**
 * Normalizes Airbnb photo URLs to high resolution (1200px width).
 */
function normalizePhotoUrl(rawUrl: string): string {
  let url = rawUrl.replace(/\\u0026/g, "&").replace(/&amp;/g, "&");
  if (url.includes("a0.muscache.com")) {
    const baseUrl = url.split("?")[0];
    return `${baseUrl}?im_w=1200`;
  }
  return url;
}

/**
 * Reverse geocodes lat/lng using OpenStreetMap Nominatim API to get accurate City, State & Address.
 */
async function reverseGeocode(lat: number, lng: number): Promise<{
  city: string;
  state: string;
  country: string;
  address: string;
  pinCode: string;
} | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: { "User-Agent": "Everloft-App/1.0" },
        next: { revalidate: 3600 },
      }
    );
    const data = await res.json();
    if (data && data.address) {
      const a = data.address;
      const rawCity = a.city || a.town || a.suburb || a.city_district || a.county || a.state_district || "";
      const state = a.state || "";
      const country = a.country || "India";
      const pinCode = a.postcode || "";
      const address = data.display_name || (rawCity ? `${rawCity}, ${state}` : "");
      if (rawCity || state || address) {
        return { city: rawCity, state, country, address, pinCode };
      }
    }
  } catch (err) {
    console.warn("Reverse geocode failed:", err);
  }
  return null;
}

/**
 * Clean raw text by stripping HTML tags.
 */
function cleanHtmlText(text: string): string {
  if (!text) return "";
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?b>/gi, "**")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/**
 * Fetches and dynamically parses any Airbnb listing page to extract full property details, photos & location.
 */
export async function parseAirbnbListing(urlInput: string): Promise<ExtractedAirbnbProperty> {
  let targetUrl = urlInput.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = `https://${targetUrl}`;
  }

  let roomId = extractAirbnbRoomId(targetUrl);

  // Follow redirect if needed (for short URLs like abnb.me)
  if (!roomId || targetUrl.includes("abnb.me")) {
    try {
      const res = await fetch(targetUrl, {
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      targetUrl = res.url;
      roomId = extractAirbnbRoomId(targetUrl);
    } catch {
      // ignore
    }
  }

  if (!roomId) {
    throw new Error("Invalid Airbnb listing URL. Please provide a valid room link (e.g. https://www.airbnb.co.in/rooms/1127955898193951447).");
  }

  const cleanFetchUrl = `https://www.airbnb.co.in/rooms/${roomId}?locale=en&currency=INR`;

  const response = await fetch(cleanFetchUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Airbnb listing (Status ${response.status}). Please verify the listing is active.`);
  }

  const html = await response.text();

  // Explicit 404 / Inactive Listing Check
  if (
    html.includes("404 Page Not Found") ||
    html.includes("We can't seem to find the page you're looking for") ||
    html.includes("error_pages/404-Airbnb") ||
    html.includes("helpful_404")
  ) {
    throw new Error("This Airbnb listing is inactive, private, or not found (404). Please verify the listing URL is active on Airbnb.");
  }

  // Extraction variables
  let name = "";
  let description = "";
  let bedrooms = 1;
  let bathrooms = 1;
  let maxGuests = 2;
  let city = "";
  let state = "";
  let country = "India";
  let address = "";
  let pinCode = "";
  let latitude: number | undefined;
  let longitude: number | undefined;
  let nightlyPrice: number | undefined;
  let currency = "INR";
  let propertyType = "Apartment";

  const photosMap = new Map<string, { url: string; caption: string; spaceTag: string }>();
  const amenityNamesSet = new Set<string>();
  const houseRules = {
    checkIn: "14:00",
    checkOut: "11:00",
    petsAllowed: false,
    smokingAllowed: false,
    partiesAllowed: false,
  };

  // 1. Extract Lat/Lng
  const latM = html.match(/"lat":(-?\d+\.\d+)/) || html.match(/"latitude":(-?\d+\.\d+)/);
  const lngM = html.match(/"lng":(-?\d+\.\d+)/) || html.match(/"longitude":(-?\d+\.\d+)/);
  if (latM) latitude = parseFloat(latM[1]);
  if (lngM) longitude = parseFloat(lngM[1]);

  // 2. Metas & JSON-LD
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const ogTitle = ogTitleMatch ? ogTitleMatch[1] : "";

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const ogDesc = ogDescMatch ? ogDescMatch[1] : "";

  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const matchTag of jsonLdMatches) {
    try {
      const jsonText = matchTag.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
      const json = JSON.parse(jsonText);
      const items = Array.isArray(json) ? json : [json];

      for (const item of items) {
        if (item.name && typeof item.name === "string" && !name) {
          name = sanitizePropertyName(item.name);
        }
        if (item.description && typeof item.description === "string" && item.description.length > description.length) {
          description = cleanHtmlText(item.description);
        }
        if (item.numberOfRooms || item.numberOfBedrooms) {
          bedrooms = bedrooms || parseInt(item.numberOfRooms || item.numberOfBedrooms, 10) || 1;
        }
        if (item.numberOfBathroomsTotal) {
          bathrooms = bathrooms || parseInt(item.numberOfBathroomsTotal, 10) || 1;
        }
        if (item.occupancy && typeof item.occupancy === "object" && item.occupancy.maxValue) {
          maxGuests = maxGuests || parseInt(item.occupancy.maxValue, 10) || 2;
        }
        if (item.address && typeof item.address === "object") {
          city = city || item.address.addressLocality || item.address.addressTown || "";
          state = state || item.address.addressRegion || "";
          country = country || item.address.addressCountry || "India";
          if (item.address.streetAddress) address = address || item.address.streetAddress;
        }
        if (item.offers && typeof item.offers === "object") {
          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          if (offer && offer.price) nightlyPrice = nightlyPrice || parseFloat(offer.price);
        }
        if (item.image) {
          const imgs = Array.isArray(item.image) ? item.image : [item.image];
          imgs.forEach((u: string, idx: number) => {
            if (typeof u === "string" && u.includes("muscache.com")) {
              const normUrl = normalizePhotoUrl(u);
              if (!photosMap.has(normUrl)) {
                photosMap.set(normUrl, { url: normUrl, caption: idx === 0 ? "Cover Image" : `Photo ${idx + 1}`, spaceTag: idx === 0 ? "Cover View" : "Living Room" });
              }
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Deep Object Traversal of Airbnb GraphQL Deferred State
  const deferredMatch = html.match(/<script id="data-deferred-state-0"[^>]*>([\s\S]*?)<\/script>/) ||
                        html.match(/<script id="data-injector-instances"[^>]*>([\s\S]*?)<\/script>/);

  if (deferredMatch) {
    try {
      const json = JSON.parse(deferredMatch[1]);

      function traverseTree(obj: unknown) {
        if (!obj || typeof obj !== "object") return;

        if (Array.isArray(obj)) {
          for (const item of obj) traverseTree(item);
          return;
        }

        const rec = obj as Record<string, unknown>;

        // pdpPresentation / Section Extraction
        if (rec.__typename === "StaysPdpSection" || rec.pdpPresentation || rec.descriptions || rec.mediaTour || rec.amenities || rec.pdpHeader) {
          const pdp = (rec.pdpPresentation || rec) as Record<string, unknown>;

          // Header Title
          if (pdp.pdpHeader && typeof pdp.pdpHeader === "object") {
            const headerObj = pdp.pdpHeader as Record<string, unknown>;
            if (headerObj.title && typeof headerObj.title === "object") {
              const tObj = headerObj.title as Record<string, unknown>;
              const cObj = tObj.content as Record<string, unknown> | undefined;
              const titleText = (cObj?.localizedString || tObj.localizedString || tObj.source) as string | undefined;
              const cleanT = sanitizePropertyName(titleText || "");
              if (cleanT && !name) name = cleanT;
            }
          }
          if (pdp.title && typeof pdp.title === "object") {
            const tObj = pdp.title as Record<string, unknown>;
            const cObj = tObj.content as Record<string, unknown> | undefined;
            const titleText = (cObj?.localizedString || tObj.localizedString || tObj.source) as string | undefined;
            const cleanT = sanitizePropertyName(titleText || "");
            if (cleanT && !name) name = cleanT;
          } else if (pdp.title && typeof pdp.title === "string") {
            const cleanT = sanitizePropertyName(pdp.title);
            if (cleanT && !name) name = cleanT;
          }

          // Descriptions
          if (pdp.descriptions && typeof pdp.descriptions === "object") {
            const descObj = pdp.descriptions as Record<string, unknown>;
            const longDescObj = descObj.longDescriptionHtml as Record<string, unknown> | undefined;
            const shortDescObj = descObj.shortDescriptionHtml as Record<string, unknown> | undefined;
            const shortContent = shortDescObj?.content as Record<string, unknown> | undefined;

            const longText = (longDescObj?.localizedString || longDescObj?.localizedStringWithTranslationPreference) as string | undefined;
            const shortText = shortContent?.localizedString as string | undefined;
            const chosen = longText || shortText;

            if (chosen && typeof chosen === "string" && chosen.length > description.length) {
              description = cleanHtmlText(chosen);
            }
          }

          if (pdp.sectionedDescription && typeof pdp.sectionedDescription === "object") {
            const sd = pdp.sectionedDescription as Record<string, unknown>;
            const parts = [sd.summary, sd.space, sd.access, sd.notes].filter((p): p is string => typeof p === "string" && p.length > 0);
            if (parts.length > 0) {
              const combined = cleanHtmlText(parts.join("\n\n"));
              if (combined.length > description.length) description = combined;
            }
          }

          // Overview Specs
          if (pdp.overview && typeof pdp.overview === "object") {
            const ov = pdp.overview as Record<string, unknown>;
            if (ov.items && Array.isArray(ov.items)) {
              for (const itemStr of ov.items) {
                if (typeof itemStr === "string") {
                  const guestMatch = itemStr.match(/(\d+)\s+guest/i);
                  if (guestMatch) maxGuests = parseInt(guestMatch[1], 10);
                  const bedMatch = itemStr.match(/(\d+)\s+bedroom/i);
                  if (bedMatch) bedrooms = parseInt(bedMatch[1], 10);
                  const bathMatch = itemStr.match(/(\d+)\s+bath/i);
                  if (bathMatch) bathrooms = parseInt(bathMatch[1], 10);
                }
              }
            }
          }

          // Media Tour Photos
          if (pdp.mediaTour && typeof pdp.mediaTour === "object") {
            const mt = pdp.mediaTour as Record<string, unknown>;
            if (mt.stops && Array.isArray(mt.stops)) {
              mt.stops.forEach((stop: unknown) => {
                if (stop && typeof stop === "object") {
                  const stopObj = stop as Record<string, unknown>;
                  const spaceName = (stopObj.name as string) || "Living Room";
                  if (stopObj.items && Array.isArray(stopObj.items)) {
                    stopObj.items.forEach((tourItem: unknown) => {
                      if (tourItem && typeof tourItem === "object") {
                        const tItem = tourItem as Record<string, unknown>;
                        const imgObj = tItem.image as Record<string, unknown> | undefined;
                        const imgUri = imgObj?.uri as string | undefined;
                        if (imgUri && typeof imgUri === "string" && imgUri.includes("muscache.com")) {
                          const normUrl = normalizePhotoUrl(imgUri);
                          const caption = (imgObj?.caption || imgObj?.altText || spaceName) as string;
                          if (!photosMap.has(normUrl)) {
                            photosMap.set(normUrl, { url: normUrl, caption, spaceTag: spaceName });
                          }
                        }
                      }
                    });
                  }
                }
              });
            }
          }

          // Amenities Tree
          if (pdp.amenities && typeof pdp.amenities === "object") {
            const amObj = pdp.amenities as Record<string, unknown>;
            const seeAll = (amObj.seeAllAmenitiesGroups || []) as unknown[];
            const preview = (amObj.previewAmenitiesGroups || []) as unknown[];
            const groups = [...seeAll, ...preview];

            groups.forEach((grp) => {
              if (grp && typeof grp === "object") {
                const gRec = grp as Record<string, unknown>;
                if (gRec.amenities && Array.isArray(gRec.amenities)) {
                  gRec.amenities.forEach((aItem) => {
                    if (aItem && typeof aItem === "object") {
                      const aRec = aItem as Record<string, unknown>;
                      if (aRec.available !== false && aRec.title && typeof aRec.title === "string") {
                        amenityNamesSet.add(aRec.title.trim());
                      }
                    }
                  });
                }
              }
            });
          }

          // Rules
          if (pdp.rules && typeof pdp.rules === "object") {
            const rObj = pdp.rules as Record<string, unknown>;
            if (rObj.groupItems && Array.isArray(rObj.groupItems)) {
              rObj.groupItems.forEach((group: unknown) => {
                if (group && typeof group === "object") {
                  const gRec = group as Record<string, unknown>;
                  if (gRec.items && Array.isArray(gRec.items)) {
                    gRec.items.forEach((rItem: unknown) => {
                      if (rItem && typeof rItem === "object") {
                        const itemRec = rItem as Record<string, unknown>;
                        const rTitle = (itemRec.title || "") as string;
                        const checkInM = rTitle.match(/check-in after\s*(\d+:\d+\s*[a-z]*|\d+\s*[a-z]+)/i);
                        if (checkInM) houseRules.checkIn = checkInM[1];
                        const checkOutM = rTitle.match(/check-out before\s*(\d+:\d+\s*[a-z]*|\d+\s*[a-z]+)/i);
                        if (checkOutM) houseRules.checkOut = checkOutM[1];
                        if (/pets allowed/i.test(rTitle)) houseRules.petsAllowed = true;
                        if (/smoking allowed/i.test(rTitle)) houseRules.smokingAllowed = true;
                        if (/parties allowed/i.test(rTitle)) houseRules.partiesAllowed = true;
                      }
                    });
                  }
                }
              });
            }
          }
        }

        // Generic photo discovery across any muscache CDN URLs (numeric, base64, etc.)
        if (rec.baseUrl && typeof rec.baseUrl === "string" && rec.baseUrl.includes("muscache.com")) {
          const normUrl = normalizePhotoUrl(rec.baseUrl);
          if (!photosMap.has(normUrl)) {
            const caption = (rec.caption || rec.accessibilityLabel || "Property Photo") as string;
            photosMap.set(normUrl, { url: normUrl, caption, spaceTag: "Living Room" });
          }
        }

        // Generic price discovery
        if (!nightlyPrice) {
          if (typeof rec.price === "number" && rec.price > 300) nightlyPrice = rec.price;
          else if (typeof rec.amount === "number" && rec.amount > 300) nightlyPrice = rec.amount;
          else if (typeof rec.rate === "number" && rec.rate > 300) nightlyPrice = rec.rate;
          else if (rec.priceString && typeof rec.priceString === "string") {
            const p = parseFloat(rec.priceString.replace(/[^0-9.]/g, ""));
            if (!isNaN(p) && p > 300) nightlyPrice = p;
          } else if (rec.formattedPrice && typeof rec.formattedPrice === "string") {
            const p = parseFloat(rec.formattedPrice.replace(/[^0-9.]/g, ""));
            if (!isNaN(p) && p > 300) nightlyPrice = p;
          }
        }

        for (const k in rec) {
          if (k !== "seeAllAmenitiesGroups" && k !== "previewAmenitiesGroups") {
            traverseTree(rec[k]);
          }
        }
      }

      traverseTree(json);
    } catch {
      // ignore
    }
  }

  // 4. Fallback photo extraction from HTML regex
  const allPhotoRegex = /https:\/\/a0\.muscache\.com\/im\/pictures\/[a-zA-Z0-9_\-\.\/]+/g;
  const rawPhotoMatches = html.match(allPhotoRegex) || [];
  rawPhotoMatches.forEach((u) => {
    if (
      !u.includes("AirbnbPlatformAssets") &&
      !u.includes("static") &&
      !u.includes("/user/") &&
      !u.includes("/av/") &&
      !u.includes("user_profile")
    ) {
      const normUrl = normalizePhotoUrl(u);
      if (!photosMap.has(normUrl)) {
        photosMap.set(normUrl, { url: normUrl, caption: "Property Photo", spaceTag: "Living Room" });
      }
    }
  });

  // 5. Title Fallbacks
  if (!name && ogDesc && ogDesc.length > 5) {
    name = sanitizePropertyName(ogDesc.split("·")[0]);
  }
  if (!name && ogTitle) {
    name = sanitizePropertyName(ogTitle.split("·")[0].split("-")[0]);
  }
  if (!name) {
    name = `Property (${roomId.slice(-6)})`;
  }

  // Specs fallbacks from ogTitle / text
  const bedM = ogTitle.match(/(\d+)\s+bedrooms?/i) || html.match(/(\d+)\s+bedrooms?/i);
  if (bedM) bedrooms = parseInt(bedM[1], 10) || bedrooms;

  const bathM = ogTitle.match(/(\d+)\s+bathrooms?/i) || html.match(/(\d+)\s+baths?/i);
  if (bathM) bathrooms = parseInt(bathM[1], 10) || bathrooms;

  const guestM = ogTitle.match(/(\d+)\s+guests?/i) || html.match(/(\d+)\s+guests?/i);
  if (guestM) maxGuests = parseInt(guestM[1], 10) || maxGuests;
  else if (bedrooms > 1) maxGuests = bedrooms * 2 + 1;

  // Property Type Detection
  if (/villa/i.test(html) || /villa/i.test(name) || /villa/i.test(ogTitle)) propertyType = "Villa";
  else if (/apartment|flat|condo|rental unit/i.test(html) || /apartment/i.test(name) || /rental unit/i.test(ogTitle)) propertyType = "Apartment";
  else if (/penthouse/i.test(html)) propertyType = "Penthouse";
  else if (/cottage|bungalow/i.test(html) || /cottage/i.test(name) || /cottage/i.test(ogTitle)) propertyType = "Holiday Home";
  else propertyType = "Luxury Home";

  // 6. Location Authority via Reverse Geocoding
  if (latitude && longitude) {
    const geoResult = await reverseGeocode(latitude, longitude);
    if (geoResult) {
      city = geoResult.city;
      state = geoResult.state;
      country = geoResult.country;
      address = geoResult.address;
      pinCode = geoResult.pinCode;
    }
  }

  // Fallbacks for Location
  if (!city || city.toLowerCase() === "po" || city.toLowerCase() === "property location") {
    const cityM = html.match(/"localizedCity":"([^"]+)"/) || html.match(/"city":"([^"]+)"/);
    if (cityM && cityM[1] && cityM[1].toLowerCase() !== "po") city = cityM[1];
  }
  if (!city) city = "Bengaluru";
  if (!state) state = country === "India" ? "Karnataka" : "";
  if (!address) address = `${name}, ${city}`;

  // Description Fallback & Clean Formatting
  if (!description || description.length < 30) {
    description = ogDesc ? cleanHtmlText(ogDesc) : "";
    if (description.length < 50) {
      description = `Welcome to ${name}, a beautifully designed ${bedrooms} BHK ${propertyType} located in ${city}. This home features spacious bedrooms, a modern kitchen, premium amenities, scenic views, and high-speed Wi-Fi — ideal for families, professionals, and group getaways.`;
    }
  }

  // Base price calculation fallback if no static date-bound price was present
  if (!nightlyPrice || nightlyPrice <= 0) {
    const priceM = html.match(/₹\s*([0-9,]+)/) || html.match(/"price":\s*"₹?\s*([0-9,]+)"/) || html.match(/"amount":\s*([0-9]+)/);
    if (priceM) {
      const parsed = parseFloat(priceM[1].replace(/,/g, ""));
      if (!isNaN(parsed) && parsed > 300) nightlyPrice = parsed;
    }
  }

  if (!nightlyPrice || nightlyPrice <= 0) {
    // Standard baseline price based on room type & capacity
    nightlyPrice = bedrooms * 2500 + 2000;
  }

  const photosArray = Array.from(photosMap.values()).map((p, idx) => ({
    url: p.url,
    caption: idx === 0 ? "Cover Image" : p.caption,
    spaceTag: p.spaceTag || (idx === 0 ? "Cover View" : "Living Room"),
  }));

  const textToScan = `${name} ${description}`;

  return {
    url: cleanFetchUrl,
    roomId,
    name,
    description,
    shortDescription: `${bedrooms} BHK ${propertyType} in ${city}`,
    propertyType,
    bedrooms,
    bathrooms,
    maxGuests,
    city,
    state,
    country,
    address,
    pinCode,
    latitude,
    longitude,
    nightlyPrice,
    currency,
    photos: photosArray,
    amenityNames: Array.from(amenityNamesSet),
    houseRules: {
      checkIn: houseRules.checkIn,
      checkOut: houseRules.checkOut,
      petsAllowed: houseRules.petsAllowed || /pets allowed|pet friendly/i.test(textToScan),
      smokingAllowed: houseRules.smokingAllowed,
      partiesAllowed: houseRules.partiesAllowed,
    },
  };
}
