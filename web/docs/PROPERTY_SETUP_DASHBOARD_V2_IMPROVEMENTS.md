# Property Setup Dashboard — v2 Improvement Spec

**Status**: Build spec, derived from real hands-on feedback on the actual live dashboard
(`/dashboard/properties/[id]/setup`, built in the previous pass — real schema, real Server
Actions, real R2 uploads, all working end to end). This document turns that raw feedback into a
concrete, actionable spec: current state, root cause where a bug was diagnosed, and the exact
change needed. Nothing in this document has been built yet — it's the plan for the next pass.

---

## 1. Editable property title, moved above "Property Basics"

**Current state**: the property name only shows as a read-only heading at the top of the
dashboard (`<h1>{property.name}</h1>` in `page.tsx`) and is separately editable buried inside the
"Title" setup card further down the page.
**Change**: make the header `<h1>` itself inline-editable (click to edit, matching the dashboard's
"effortless" philosophy) — an inline text field that saves via the existing `saveTitleAction` on
blur/Enter, with the same `Saved`/`Saving...` indicator pattern already used elsewhere
(`section-form-shell.tsx`). This becomes the primary place to rename a property; the "Title"
setup card lower on the page keeps its fuller field (title + short name + character count) for
users who want the guided version, but editing the header directly is the fast path.
**Files touched**: `app/dashboard/properties/[id]/setup/page.tsx` (header markup), a new small
client component `components/dashboard/properties/setup/editable-title.tsx` wrapping
`saveTitleAction`.

---

## 2. Completion card — drop "Estimated Time," show something earned

**Current state**: the top card shows Property Complete %, Required remaining, Recommended
remaining, Estimated Time Remaining, Last Edited.
**Feedback**: Estimated Time isn't valuable — drop it in favor of something more useful if
available.
**Replacement, using data already computed by `onboarding.service.ts`**: swap Estimated Time for
the **Readiness Score** (already computed, currently only shown in the right column) — surfacing
it in the top card too means the two most important numbers (completion, readiness) are visible
without scrolling, and reinforces the distinction between them right where a user first looks.
Keep Required/Recommended remaining and Last Edited as-is (both are genuinely useful, keep).

---

## 3. Location — real Google Maps integration

**Current state**: `LocationForm` (`section-forms.tsx`) is plain text inputs for
country/state/city/address/latitude/longitude/googleMapsUrl — no map, no autocomplete, no
reverse geocoding.

**Target**: a real interactive map picker —
- **Search box** (Google Places Autocomplete) — typing an address shows suggestions; selecting
  one drops a pin and fills city/state/country/postal code/lat/long automatically via the
  selected place's address components.
- **Draggable pin** on an embedded map (Google Maps JavaScript API) — dragging it re-runs reverse
  geocoding (Geocoding API) and re-fills the address fields from the new pin position, so a host
  can fine-tune the exact spot after search gets them close.
- **Manual entry stays available** — the text fields remain editable directly for hosts who'd
  rather type than use the map (accessibility + the "no fancy dependency required to finish
  setup" principle already established for this dashboard).

**Why this needs a real API key before it can be built** (not yet configured anywhere in this
project — `.env` has no `GOOGLE_MAPS_API_KEY`): all three pieces (Autocomplete, the map render,
Geocoding) are billed Google Cloud APIs.

### Setup steps (to follow before this feature can be built — same pattern as the Supabase/R2 setup earlier in this project)

1. Go to **console.cloud.google.com**, create a project (or reuse one) — e.g. "Everloft".
2. **APIs & Services → Library** — enable three APIs individually:
   - **Maps JavaScript API** (renders the interactive map)
   - **Places API** (search/autocomplete)
   - **Geocoding API** (pin-drag → address, and address → pin)
3. **APIs & Services → Credentials → Create Credentials → API Key.**
4. **Restrict the key** (important — an unrestricted Maps key is a common source of billing
   abuse): Application restrictions → HTTP referrers → add your domain(s)
   (`localhost:3000/*` for dev, your real domain for production). API restrictions → limit to
   exactly the 3 APIs enabled in step 2.
5. Google Cloud requires a **billing account** attached to use these APIs, same as Cloudflare R2
   did — there's a substantial free monthly credit ($200/mo as of writing, covering many
   thousands of map loads/geocodes for a project this size), but the card is required upfront.
6. Paste the key here once you have it, in the same handoff pattern as Supabase/R2: I add it to
   `.env` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (must be `NEXT_PUBLIC_` since the map renders
   client-side) and wire the actual `LocationForm` map/autocomplete UI against it.

**Schema**: no new migration needed — `properties.latitude/longitude/address/city/state/country/
google_maps_url` already exist and already are exactly the fields this integration fills in.

---

## 4. Photo upload — real bugs, diagnosed against the actual code (not guessed)

### Bug 1: "shows 1MB" limit instead of the real 25MB limit
**Root cause, confirmed by reading the code**: `next.config.ts` has no
`experimental.serverActions.bodySizeLimit` set, so **Next.js's default 1MB request body cap**
applies to `uploadPropertyPhotoAction` (a Server Action) — completely independent of
`FILE_SIZE_LIMITS[BUCKETS.propertyImages]` in `lib/storage/r2.ts`, which is correctly set to
25MB and never even gets reached, because Next.js itself rejects the request before it arrives.
**Fix**: raise the Server Action body limit in `next.config.ts`:
```ts
const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "30mb" }, // covers the 25MB property-image limit + overhead
  },
};
```
This is a one-line, low-risk fix — not a workaround, the actual cause.

### Bug 2: photo preview fails after upload
**Root cause, confirmed**: `R2_PUBLIC_BASE_URL` is still not configured (no custom domain
attached to the `everloft-web` R2 bucket yet — flagged as an open item since the Storage module
was built). `uploadPropertyPhotoAction` requests `makePublic: true`, but with no public base URL
the `files.public_url` column is correctly `null` (the graceful-fallback fix from the previous
session), so `PhotosManager`'s `<Image src={photo.publicUrl}>` has nothing to render and falls
back to "No preview."
**Fix, two parts**:
1. **Immediate, no config needed**: switch `PhotosManager`'s post-upload thumbnails to fetch a
   **signed URL** (`GET /api/files/[id]/signed-url`, already live) instead of relying on
   `public_url` — works today regardless of whether a public domain is ever attached.
2. **Longer-term, for the real public-facing listing site**: attach a public domain to the R2
   bucket (Cloudflare dashboard → R2 → bucket → Settings → Public access → connect a domain or
   use the `r2.dev` subdomain) and set `R2_PUBLIC_BASE_URL` — needed eventually since a live
   guest-facing property page shouldn't serve every photo through a signed-URL round trip.

### Feature: local preview → review → upload, not upload-on-select
**Current flow**: selecting files immediately uploads each one (`handleFiles` in
`photos-manager.tsx` calls `uploadPropertyPhotoAction` per file right away).
**Target flow** (the one requested): selecting files shows **local, pre-upload previews**
(`URL.createObjectURL(file)` — instant, no network call) in a staging grid, each removable with
an ✕ before anything is sent anywhere. Only when the host clicks an explicit **"Upload N
Photos"** button do the staged files actually upload (in parallel, per-file progress). After
upload, the staged previews are replaced by the real uploaded grid (using the signed-URL fix
above), each still removable via the already-working `removePropertyPhotoAction`.
**Why this is a better flow, not just "what was asked"**: it matches how every modern upload UI
works (Google Photos, WhatsApp, Airbnb itself) — committing to an upload should be a deliberate
action, not an accidental one from a slow multi-select where the first file is already uploading
before you've finished picking the rest.
**Multiple select**: already technically works today (`<input multiple>` is already set) — the
"felt broken" report is almost certainly the same 1MB Server Action limit above, silently failing
on the 2nd+ file (or even the 1st, if it's over 1MB) while looking like multi-select itself
doesn't work. Fixing Bug 1 likely fixes this symptom too; verify after.

---

## 5. General interactivity

Covered concretely by items 1–4 and 6–8 below rather than as a separate abstract task — "more
interactive, more data" cashes out as: an editable title, a smarter completion card, a real map,
a real photo-review flow, and dramatically fuller amenities/rules/pricing data entry. No separate
work item beyond those.

---

## 6. Amenities — full expansion (28 seeded today → the complete 15-category list below)

**Current state**: `amenity_master` has 28 rows across the original spec's shorter list.
**Target**: replace/extend with the full ~200-item, 15-category list below — this becomes an
additive seed migration (`INSERT ... ON CONFLICT DO NOTHING`, same pattern as the original seed),
not a schema change (`amenity_master`'s `category` check constraint already needs widening to
match these 15 category slugs, since the current constraint only allows the original set of 15 —
worth double-checking the exact slugs line up 1:1, which they do by design below).

| # | Category | Items |
|---|---|---|
| 1 | Essentials | Wi-Fi, High-speed Wi-Fi, Dedicated workspace, TV, Smart TV, Air conditioning, Ceiling fan, Portable fan, Heating, Iron, Clothes drying rack, Hangers, Bed linens, Extra pillows & blankets, Blackout curtains, Mosquito repellent, First aid kit |
| 2 | Bathroom | Hot water, Shower, Bathtub, Toilet, Bidet, Shampoo, Conditioner, Body soap, Hand soap, Toilet paper, Towels, Hair dryer, Cleaning products |
| 3 | Bedroom | King bed, Queen bed, Double bed, Single bed, Sofa bed, Floor mattress, Crib, Travel cot, Wardrobe, Nightstand, Reading lamp |
| 4 | Kitchen & Dining | Full kitchen, Kitchenette, Refrigerator, Freezer, Microwave, Gas stove, LPG gas stove, Induction cooktop, Oven, Toaster, Rice cooker, Electric kettle, Coffee maker, Mixer/Blender, Mixer grinder, Water purifier (RO), Drinking water, Cookware, Frying pan, Pressure cooker, Indian cooking utensils, Tawa, Plates, Bowls, Cups, Wine glasses, Cutlery, Dining table, High chair, Tea & coffee starter kit, Basic spices |
| 5 | Internet & Office | High-speed fiber Wi-Fi, Ethernet, Dedicated workspace, Printer, Monitor, UPS, Inverter backup, Power backup |
| 6 | Entertainment | Smart TV, Cable TV, Netflix, Amazon Prime Video, Disney+ Hotstar, Bluetooth speaker, Home theatre, Board games, Books, Children's toys, PlayStation, Xbox, Pool table, Foosball |
| 7 | Family | Family friendly, Crib, High chair, Baby bath, Children's books, Children's toys, Children's dinnerware, Stair gates, Outlet covers |
| 8 | Heating & Cooling | Air conditioning, Ceiling fan, Portable fan, Heater, Fireplace, Indoor fireplace |
| 9 | Safety & Security | Smoke alarm, Carbon monoxide alarm, Fire extinguisher, CCTV (Outdoor), CCTV at entrance, Security alarm, Smart lock, Digital door lock, Safe, Emergency contact list, Medical kit |
| 10 | Outdoor | Balcony, Balcony seating, Patio, Garden, Backyard, Terrace, BBQ grill, Fire pit, Outdoor dining area, Outdoor furniture, Swing, Hammock |
| 11 | Parking & Building | Free parking, Paid parking, Car parking, EV charger, Elevator, Lift, Swimming pool, Private pool, Shared pool, Hot tub, Jacuzzi, Gym, Sauna, Steam room |
| 12 | Accessibility | Step-free entrance, Wide doorway, Elevator access, Accessible bathroom, Roll-in shower, Shower chair, Grab bars, Accessible parking, Well-lit entrance |
| 13 | Guest Services | Self check-in, Lockbox, Smart lock, Host greeting, Luggage drop-off, Housekeeping, Daily housekeeping, Long-term stays allowed, Cleaning during stay, Breakfast, Room service, Airport pickup, Caretaker, Caretaker on call, Concierge, Local guidebook |
| 14 | Pet Friendly | Pets allowed, Pet bowls, Pet bed, Fenced yard |
| 15 | Views & Location | Mountain view, Beach view, Beachfront, Lake view, River view, Garden view, City skyline view, Ski-in/Ski-out, Resort access, Private entrance |

**Note on duplicates across categories** (Wi-Fi, Smart TV, Crib, Smart lock, etc. appear in more
than one category in the source list): `amenity_master.slug` is unique, so each amenity is seeded
**once**, under its most natural primary category — e.g. "Smart Lock" lives under Safety &
Security, not duplicated again under Guest Services. `AmenitiesForm` already renders amenities
grouped by category from a single flat list, so this doesn't need a UI change, just a seeding
decision (documented here so it's deliberate, not an oversight).
**UI impact**: `AmenitiesForm` (`amenities-form.tsx`) already handles arbitrary category counts
and item counts generically — no component change needed, just the bigger seed data. Worth
adding a **search/filter box** at the top of the amenities panel once the list triples in size,
so a host isn't scrolling through 200 checkboxes to find "Wi-Fi."

---

## 7. House Rules — dynamic custom rules + the full standard preset list

**Current state**: `HouseRulesForm` only has 3 fixed boolean toggles (smoking/pets/parties) plus
check-in/out time and deposit — stored as `property_rules` rows with a hardcoded `rule_key` check
constraint limited to `smoking | pets | parties | quiet_hours | visitors | ...` (14 fixed keys,
from the original Property Management Module migration).

**Target — two-part redesign**:
1. **Preset picker**: a searchable multi-select of the ~65-item standard list below (grouped
   loosely by theme for scannability) — clicking one adds it as a `property_rules` row with
   `rule_key = 'preset'` and the literal text as `rule_text`.
2. **Free-text custom rules**: an "Add your own rule" input beneath the presets — appends a row
   with `rule_key = 'custom'`. This is the "dynamic data entry... like quiet hour can add
   manually" ask specifically — quiet hours is already a good example of a rule that needs a
   host-specific value (e.g. "Quiet hours 10 PM–7 AM" vs. "Quiet hours 11 PM–8 AM"), which a
   fixed boolean toggle can never capture — custom free-text solves exactly that case, and also
   covers the standard list's many free-text-shaped entries below (parking instructions, deposit
   amounts stated in plain language, etc.) that don't reduce to a toggle either.

**Schema change needed**: `property_rules.rule_key`'s check constraint currently enumerates 14
fixed keys — widen it to add `'preset'` and `'custom'` as valid values (small additive
migration), since rules are now mostly represented by their free-text `rule_text` rather than a
closed set of semantic keys.

**Standard rules list** (~65 items, for the preset picker):
Smoking allowed · No smoking · Vaping allowed · No vaping · Pets allowed · No pets · Service
animals allowed · Events allowed · No events or parties · Quiet hours (e.g., 10 PM–7 AM) · No
loud music · No outside visitors · Registered guests only · Maximum occupancy limit · Children
allowed · Infants allowed · Not suitable for children · Not suitable for infants · Commercial
photography allowed · No commercial photography · Filming allowed with permission · No illegal
activities · No drugs · No weapons · Respect neighbors · Keep noise to a minimum · No shoes
inside · Lock doors and windows when leaving · Turn off lights, fans, and AC when leaving ·
Conserve water · Report any damage immediately · Guests are responsible for damages · Keep the
property clean · Wash used dishes before checkout · Dispose of garbage properly · Do not
rearrange furniture · Do not remove household items · Follow pool safety rules · Children must
be supervised · Use kitchen appliances safely · Do not flush sanitary products · Use towels
appropriately · No candles or open flames · BBQ only in designated area · Parking only in
designated space · EV charging only with permission · Follow check-in instructions · Follow
check-out instructions · Return keys/remote controls · Self check-in available · ID verification
required · Passport/ID required for all guests (where applicable) · Security deposit may apply ·
Early check-in subject to availability · Late check-out subject to availability · Additional
guest fee applies · Long-term stays allowed · Keep balcony doors closed during rain · Do not feed
wildlife · Respect local community rules

---

## 8. Pricing — full expansion (6 field groups, ~40 fields, vs. today's 5)

**Current state**: `property_pricing` has `base_price, weekend_price, monthly_price,
weekly_discount_percent, monthly_discount_percent, extra_guest_fee, extra_guest_after,
cleaning_fee, management_fee_percent, currency` — plus `property_pricing_overrides` for
date-ranged seasonal/holiday pricing and `property_taxes` for tax rate configuration, all already
live from the Property Management Module.

**Target — organize the setup card's Pricing UI into 6 tabs/sub-sections mapping to real (mostly
already-existing) schema, with new fields added where genuinely missing**:

| Group | Fields | Schema status |
|---|---|---|
| **1. Base Pricing** | Base price/night, Weekend price (Fri–Sat), Weekday price*, Holiday price, Festival price*, Peak season price*, Off-season price*, Min nightly price*, Max nightly price* | `base_price`/`weekend_price` exist; Holiday/Festival/Peak/Off-season map onto `property_pricing_overrides` (already supports arbitrary named date-ranged prices via `override_type`/`name`) — *Weekday price, Min/Max nightly price are genuinely new columns on `property_pricing` |
| **2. Stay Rules** | Min/max stay, Same-day booking allowed*, same-day cutoff time*, Advance booking window, Prep time, Instant Book | `property_settings.min_stay_nights/max_stay_nights/advance_notice_hours/preparation_time_hours/instant_book` all already exist — *same-day booking fields are new |
| **3. Guest Pricing** | Standard occupancy*, Max occupancy (=`properties.max_guests`, existing), Extra guest fee (exists), Child fee*, Infant fee*, Pet fee*, Visitor fee* | Only extra_guest_fee exists today — the rest (*) are new columns |
| **4. Discounts** | Weekly/monthly discount (exist), Last-minute*, Early-bird*, Non-refundable-rate*, Long-stay*, Repeat-guest*, Promo coupon*, First-booking*, Seasonal promo* | 2 of 9 exist; rest are new — recommend a `property_discounts` child table (one row per discount type + value + conditions) rather than 7 more columns on `property_pricing`, since discounts have enable/percent/condition shape in common (same normalization reasoning as `property_pricing_overrides`) |
| **5. Fees** | Cleaning (exists), Linen*, Laundry*, Resort*, Service*, Utility*, Security deposit (exists on `properties`), Damage waiver*, Late checkout*, Early checkin*, Extra bed* | Recommend a `property_fees` child table (fee_type, amount, is_percentage) rather than ~10 new columns — same reasoning as Discounts |
| **6. Taxes** | GST included/excluded, GST %, Local tax, Tourism tax | `property_taxes` already supports arbitrary named tax rows with `is_inclusive` — this group needs **no schema change**, just a UI that lets a host add multiple named tax rows (GST, Local Tax, Tourism Tax) against the table that already exists |

**Recommended schema additions** (two new small tables, following the established normalization
pattern from `docs/DATABASE_DESIGN.md` rather than dozens of sparse columns):
```sql
create table property_discounts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  discount_type text check (discount_type in (
    'last_minute','early_bird','non_refundable','long_stay',
    'repeat_guest','promo_coupon','first_booking','seasonal_promo'
  )),
  value_percent numeric(5,2),
  coupon_code text,           -- only meaningful for promo_coupon
  conditions jsonb default '{}'::jsonb,  -- e.g. {"min_nights": 28} for long_stay
  is_active boolean default true,
  -- + standard audit columns
);

create table property_fees (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  fee_type text check (fee_type in (
    'linen','laundry','resort','service','utility',
    'damage_waiver','late_checkout','early_checkin','extra_bed'
  )),
  amount numeric(12,2),
  is_percentage boolean default false,
  -- + standard audit columns
);
```
Plus a handful of direct new columns on `property_pricing` (weekday_price, min_nightly_price,
max_nightly_price, standard_occupancy, child_fee, infant_fee, pet_fee, visitor_fee) and
`property_settings` (same_day_booking_allowed, same_day_cutoff_time).

---

## Priority order recommendation (for when this gets built)

1. **Bug fixes first** (§4's two real bugs) — cheapest, highest-impact, no new schema.
2. **Editable title + completion card swap** (§1–2) — small, self-contained.
3. **Amenities + House Rules expansion** (§6–7) — pure seed data + one schema widen, no new
   tables, high visible value.
4. **Pricing expansion** (§8) — the biggest schema lift (2 new tables), do after the above land.
5. **Google Maps** (§3) — gated on you providing a real API key per the setup steps above; can
   happen in parallel with anything else once that key exists.
