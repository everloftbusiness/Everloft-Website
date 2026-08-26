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
  photos: { url: string; caption?: string }[];
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
 * - https://www.airbnb.co.in/rooms/1755951932544627392?guests=1
 * - https://www.airbnb.com/rooms/plus/12345678
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
      const city = a.city || a.town || a.suburb || a.city_district || a.county || "";
      const state = a.state || "";
      const country = a.country || "India";
      const pinCode = a.postcode || "";
      const address = data.display_name || (city ? `${city}, ${state}` : "");
      if (city || state || address) {
        return { city, state, country, address, pinCode };
      }
    }
  } catch (err) {
    console.warn("Reverse geocode failed:", err);
  }
  return null;
}

/**
 * Fetches and parses an Airbnb listing page to extract property details, real photos & location.
 */
export async function parseAirbnbListing(urlInput: string): Promise<ExtractedAirbnbProperty> {
  let targetUrl = urlInput.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = `https://${targetUrl}`;
  }

  let roomId = extractAirbnbRoomId(targetUrl);

  // Follow redirect if needed
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
    throw new Error("Invalid Airbnb listing URL. Please provide a valid room link (e.g. https://www.airbnb.co.in/rooms/1755951932544627392).");
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

  // Explicit 404 / Inactive Listing Check (Airbnb returns 200 OK for soft 404 pages)
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

  // 1. Metas & Titles
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const ogTitle = ogTitleMatch ? ogTitleMatch[1] : "";

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const ogDesc = ogDescMatch ? ogDescMatch[1] : "";

  // 2. Parse JSON-LD script tags
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const matchTag of jsonLdMatches) {
    try {
      const jsonText = matchTag.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
      const json = JSON.parse(jsonText);
      const items = Array.isArray(json) ? json : [json];

      for (const item of items) {
        if (item.name && typeof item.name === "string" && item.name !== "Airbnb" && !name) {
          name = item.name.replace(/\s*-\s*Airbnb\s*$/i, "").trim();
        }
        if (item.description && typeof item.description === "string" && item.description.length > description.length) {
          description = item.description.trim();
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
      }
    } catch {
      // ignore
    }
  }

  // Name Resolution (Precedence: real name -> ogDesc -> ogTitle -> room code)
  if (!name && ogDesc && ogDesc.length > 5) {
    name = ogDesc.trim();
  }
  if (!name && ogTitle) {
    name = ogTitle.split("·")[0].split("-")[0].trim();
  }
  if (!name) {
    name = `Property (${roomId.slice(-6)})`;
  }

  // Extract deep full description from deferred JSON state
  const deferredMatchForDesc = html.match(/<script id="data-deferred-state-0"[^>]*>([\s\S]*?)<\/script>/) ||
                               html.match(/<script id="data-injector-instances"[^>]*>([\s\S]*?)<\/script>/);

  if (deferredMatchForDesc) {
    try {
      const json = JSON.parse(deferredMatchForDesc[1]);

      function searchDescription(obj: unknown) {
        if (!obj) return;
        if (typeof obj === "object") {
          if (Array.isArray(obj)) {
            for (const item of obj) searchDescription(item);
          } else {
            const record = obj as Record<string, unknown>;
            if (record.localizedString && typeof record.localizedString === "string") {
              const str = record.localizedString;
              if (str.length > description.length && (str.includes("The space") || str.includes("Guest access") || str.includes("Electronic City") || str.length > 200)) {
                const cleaned = str
                  .replace(/<br\s*\/?>/gi, "\n")
                  .replace(/<\/?b>/gi, "**")
                  .replace(/<[^>]+>/g, "")
                  .trim();
                if (cleaned.length > description.length) {
                  description = cleaned;
                }
              }
            }
            if (record.description && typeof record.description === "string" && record.description.length > description.length && !record.description.includes("<html")) {
              description = record.description.trim();
            }
            if (record.htmlAndText && typeof record.htmlAndText === "object") {
              const txt = (record.htmlAndText as Record<string, unknown>).text;
              if (typeof txt === "string" && txt.length > description.length) {
                description = txt.trim();
              }
            }
            if (record.sectionedDescription && typeof record.sectionedDescription === "object") {
              const sd = record.sectionedDescription as Record<string, unknown>;
              const parts = [sd.summary, sd.space, sd.access, sd.notes].filter(Boolean);
              if (parts.length > 0) {
                const combined = parts.join("\n\n");
                if (combined.length > description.length) description = combined;
              }
            }
            for (const key in record) searchDescription(record[key]);
          }
        }
      }

      searchDescription(json);
    } catch {}
  }

  // Description Fallback & Clean Formatting
  if (!description || description.endsWith("...") || description.length < 50) {
    description = ogDesc ? ogDesc.replace(/\s*\.\.\.\s*$/, "") : "";
    if (description.length < 100) {
      description = `Welcome to ${name}, a beautifully designed ${bedrooms} BHK ${propertyType} located in ${city}. This home features spacious bedrooms, a modern kitchen, premium amenities, scenic balcony views, and high-speed Wi-Fi — ideal for families, professionals, and group getaways.`;
    }
  }

  // 3. Extract Specs from ogTitle & text
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
  else if (/cottage|bungalow/i.test(html)) propertyType = "Holiday Home";
  else propertyType = "Luxury Home";

  // 4. Extract Lat/Lng & Location
  const latM = html.match(/"lat":(-?\d+\.\d+)/) || html.match(/"latitude":(-?\d+\.\d+)/);
  const lngM = html.match(/"lng":(-?\d+\.\d+)/) || html.match(/"longitude":(-?\d+\.\d+)/);
  if (latM) latitude = parseFloat(latM[1]);
  if (lngM) longitude = parseFloat(lngM[1]);

  if (latitude && longitude) {
    const geoResult = await reverseGeocode(latitude, longitude);
    if (geoResult) {
      city = city || geoResult.city;
      state = state || geoResult.state;
      country = country || geoResult.country;
      address = address || geoResult.address;
      pinCode = pinCode || geoResult.pinCode;
    }
  }

  // Extract City & State from JSON script data if not set by geocoder
  if (!city) {
    const cityM = html.match(/"localizedCity":"([^"]+)"/) || html.match(/"city":"([^"]+)"/);
    if (cityM) city = cityM[1];
  }
  if (!state) {
    const stateM = html.match(/"localizedState":"([^"]+)"/) || html.match(/"state":"([^"]+)"/);
    if (stateM) state = stateM[1];
  }
  if (!city && ogTitle) {
    const locInTitle = ogTitle.match(/in\s+([^·\n]+)/i);
    if (locInTitle) city = locInTitle[1].trim();
  }

  // Dynamic Location Fallbacks (no hardcoded "Bengaluru")
  if (!city) city = "Property Location";
  if (!state) state = country === "India" ? "India" : "";
  if (!address) address = `${name}, ${city}`;

  // 5. Extract Price from JSON strings if not set
  if (!nightlyPrice) {
    const priceM = html.match(/"price":\s*"?₹?\s*(\d[\d,]*)"?/) || html.match(/"amount":\s*(\d+)/);
    if (priceM) {
      const parsed = parseFloat(priceM[1].replace(/,/g, ""));
      if (!isNaN(parsed) && parsed > 100) nightlyPrice = parsed;
    }
  }

  // 6. Extract Real Property Photos with Room Captions & Space Tags
  const photoCaptionsMap = new Map<string, { caption: string; spaceTag: string }>();

  if (deferredMatchForDesc) {
    try {
      const json = JSON.parse(deferredMatchForDesc[1]);

      function traversePhotos(obj: unknown) {
        if (!obj) return;
        if (typeof obj === "object") {
          if (Array.isArray(obj)) {
            for (const item of obj) traversePhotos(item);
          } else {
            const rec = obj as Record<string, unknown>;
            if (rec.baseUrl && typeof rec.baseUrl === "string") {
              const photoUrl = normalizePhotoUrl(rec.baseUrl);
              const caption = (rec.caption || rec.accessibilityLabel || rec.title || "") as string;

              let spaceTag = "Living Room";
              const capLower = caption.toLowerCase();
              if (capLower.includes("bedroom 1")) spaceTag = "Bedroom 1";
              else if (capLower.includes("bedroom 2")) spaceTag = "Bedroom 2";
              else if (capLower.includes("bedroom 3")) spaceTag = "Bedroom 3";
              else if (capLower.includes("kitchen")) spaceTag = "Kitchen";
              else if (capLower.includes("dining")) spaceTag = "Dining Area";
              else if (capLower.includes("bathroom")) spaceTag = "Bathroom";
              else if (capLower.includes("balcony")) spaceTag = "Balcony";
              else if (capLower.includes("exterior")) spaceTag = "Exterior";
              else if (capLower.includes("living")) spaceTag = "Living Room";

              if (photoUrl.includes("muscache.com") && !photoCaptionsMap.has(photoUrl)) {
                photoCaptionsMap.set(photoUrl, { caption: caption || spaceTag, spaceTag });
              }
            }
            for (const k in rec) traversePhotos(rec[k]);
          }
        }
      }

      traversePhotos(json);
    } catch {}
  }

  const hostingRegex = new RegExp(`https:\\\/\\\/a0\\.muscache\\.com\\\/im\\\/pictures\\\/hosting\\\/Hosting-${roomId}\\\/[a-zA-Z0-9_\\-\\.\\\/]+`, "g");
  const hostingMatches = html.match(hostingRegex) || [];
  const hostingPhotos = [...new Set(hostingMatches.map((u) => normalizePhotoUrl(u)))];

  const allPhotoRegex = /https:\/\/a0\.muscache\.com\/im\/pictures\/[a-zA-Z0-9_\-\.\/]+/g;
  const allMatches = html.match(allPhotoRegex) || [];
  const fallbackPhotos = [...new Set(allMatches.filter((u) =>
    !u.includes("AirbnbPlatformAssets") &&
    !u.includes("static") &&
    !u.includes("/user/") &&
    !u.includes("/av/") &&
    !u.includes("user_profile")
  ).map((u) => normalizePhotoUrl(u)))];

  const finalPhotosList = [...new Set([...hostingPhotos, ...fallbackPhotos])];

  const photosArray = finalPhotosList.map((url, idx) => {
    const meta = photoCaptionsMap.get(url);
    const spaceTag = meta?.spaceTag || (idx === 0 ? "Cover View" : "Living Room");
    const caption = meta?.caption || (idx === 0 ? "Cover Image" : `${spaceTag} Photo ${idx + 1}`);
    return {
      url,
      caption,
      spaceTag,
    };
  });

  // 7. Amenities Detection (Parses listing's exact JSON amenity tree - strictly INCLUDED only)
  const amenityNamesSet = new Set<string>();
  const IGNORE_CATEGORIES = new Set([
    "Not included", "Home safety", "Location features", "Services",
    "Parking and facilities", "Outdoor", "Kitchen and dining",
    "Internet and office", "Heating and cooling", "Entertainment",
    "Bedroom and laundry", "Bathroom"
  ]);

  function isExplicitlyAvailable(rec: unknown): boolean {
    if (!rec || typeof rec !== "object") return false;
    const record = rec as Record<string, unknown>;
    if (record.available === false || record.isPresent === false || record.isAvailable === false) return false;
    if (record.available === true || record.isPresent === true || record.isAvailable === true) return true;
    return false;
  }

  // Parse data-deferred-state-0 / script tags for exact listing amenities
  const deferredMatch = html.match(/<script id="data-deferred-state-0"[^>]*>([\s\S]*?)<\/script>/) ||
                        html.match(/<script id="data-injector-instances"[^>]*>([\s\S]*?)<\/script>/);
  if (deferredMatch) {
    try {
      const json = JSON.parse(deferredMatch[1]);

      function searchAmenitiesTree(obj: unknown, parentKey = "") {
        if (!obj) return;
        if (typeof obj === "object") {
          if (Array.isArray(obj)) {
            for (const item of obj) searchAmenitiesTree(item, parentKey);
          } else {
            const record = obj as Record<string, unknown>;
            const keyName = (record.title || record.name || record.subtitle || "") + "";

            // Skip if parent or current section indicates "Not included" / "Unavailable"
            if (
              keyName.toLowerCase().includes("not included") ||
              keyName.toLowerCase().includes("unavailable") ||
              parentKey.toLowerCase().includes("not included") ||
              parentKey.toLowerCase().includes("unavailable")
            ) {
              return;
            }

            if (record.title && typeof record.title === "string" && isExplicitlyAvailable(record) && !IGNORE_CATEGORIES.has(record.title) && record.title.length < 50) {
              amenityNamesSet.add(record.title.trim());
            }

            for (const key in record) {
              if (key.toLowerCase().includes("unavailable") || key.toLowerCase().includes("notincluded")) {
                continue;
              }

              if (key.toLowerCase().includes("amenit")) {
                const val = record[key];
                if (Array.isArray(val)) {
                  for (const v of val) {
                    if (v && typeof v === "object" && isExplicitlyAvailable(v)) {
                      const t = ((v as Record<string, unknown>).title || (v as Record<string, unknown>).name) as string | undefined;
                      if (t && typeof t === "string" && !IGNORE_CATEGORIES.has(t) && t.length < 50) {
                        amenityNamesSet.add(t.trim());
                      }
                    }
                  }
                }
              }
              searchAmenitiesTree(record[key], keyName || parentKey);
            }
          }
        }
      }

      searchAmenitiesTree(json);
    } catch {}
  }

  // Common keywords fallback if json tree was missing
  if (amenityNamesSet.size === 0) {
    const textToScan = `${name} ${description}`;
    if (/wifi|wi-fi|internet/i.test(textToScan)) amenityNamesSet.add("Wifi");
    if (/pool|swimming pool/i.test(textToScan)) amenityNamesSet.add("Swimming Pool");
    if (/air conditioning|ac|a\/c/i.test(textToScan)) amenityNamesSet.add("Air Conditioning");
    if (/parking/i.test(textToScan)) amenityNamesSet.add("Free Parking");
    if (/kitchen/i.test(textToScan)) amenityNamesSet.add("Kitchen");
    if (/tv|television/i.test(textToScan)) amenityNamesSet.add("TV");
    if (/balcony|terrace/i.test(textToScan)) amenityNamesSet.add("Balcony");
    if (/washer|washing machine/i.test(textToScan)) amenityNamesSet.add("Washing Machine");
  }

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
      checkIn: "14:00",
      checkOut: "11:00",
      petsAllowed: /pets allowed|pet friendly/i.test(textToScan),
      smokingAllowed: false,
      partiesAllowed: false,
    },
  };
}
