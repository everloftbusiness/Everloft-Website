# Everloft `web/` — Agent & Developer Guide

## 1. Quick Commands
- Dev Server: `npm.cmd run dev` (run inside `web/`)
- Typecheck: `npx.cmd tsc --noEmit`
- Production Build: `npm.cmd run build`

---

## 2. Test Accounts (Supabase Auth)
Never put test-account passwords in this public repository. Provision users through
Supabase Auth and keep credentials in an approved private password manager. Previously
documented shared passwords must be considered exposed and rotated.

---

## 3. Core Architectural Rules

### Pricing & Tax (+ GST)
- All guest-facing prices include **`+ GST`** badge (`formatCurrency(...) / night + GST`).
- Booking widgets include itemized **`GST & Taxes (18%)`** and **`Total (inc. GST)`**.
- Setup forms specify base rates as `(excl. 18% GST)`.

### Physical File & Blob Deletion
- Removing photos or videos physically deletes the object from Cloudflare R2 / storage bucket via `deleteObject(bucket, object_key)` inside `onboarding.actions.ts`.

### Interactive Leaflet Maps
- All maps use Leaflet with CartoDB Voyager Streets + Google Satellite Hybrid tiles.
  - `PropertyLocationMap` (`src/components/property/property-location-map.tsx`) — Guest property details page.
  - `PropertiesMapView` (`src/components/property/properties-map-view.tsx`) — All-properties map view (`/properties?view=map`).
  - `ContactOfficeMap` (`src/components/contact/contact-office-map.tsx`) — Contact page Everloft HQ map.
  - `InteractiveLocationMap` (`src/components/dashboard/properties/setup/interactive-location-map.tsx`) — Onboarding location step.

### Navbar State
- In `navbar.tsx`: `solid = !isHomePage || scrolled || open`.
- Unscrolled homepage (`/`) is transparent; **all inner pages are solid** with dark text and frosted backdrop.

### Property Page Layout Sequence
1. Gallery (`property-gallery.tsx`)
2. Key Specs (BHK, Max Guests, Baths, Sqft)
3. Managed Guarantee
4. About This Stay & Highlights
5. **What This Place Offers** (`property-amenities-showcase.tsx`)
6. **Where You'll Sleep** (`property-bedrooms-showcase.tsx`)
7. **Location Map** (`property-location-map.tsx`)
8. House Rules & Stay Policies
9. Spaces Explorer
10. Video Tour (`#video-tour`)
11. Sticky Booking Sidebar (Desktop) / Sticky Booking Bar (Mobile)

### Mobile Viewport & Ergonomics
- `.site-container` uses `px-4 sm:px-6 md:px-10 lg:px-16`.
- Mobile navigation drawers in `navbar.tsx` and `dashboard-header.tsx`.
- Global floating WhatsApp button positioned at `bottom-20 right-4` on mobile to avoid overlapping sticky bars.

### Multi-Calendar & iCal Sync Engine (`src/components/dashboard/properties/property-calendar-grid.tsx`)
- **Exclusive PMS End-Date Logic**: Date ranges follow `[startDate, endDate)`. 1-night block (`startDate === endDate`) resolves `endYmd = startDate + 1 day` via `getEffectiveBlockDates()`.
- **Continuous Bar Styling**: Multi-day stay bars float at `z-20 -mx-[9px] w-[calc(100%+18px)]` to cover 1px cell borders cleanly with 0 narrow line gaps.
- **Uncut Label Rendering**: Check-in labels (e.g. `"Owner Stay / Maintenance"`) use `whitespace-nowrap overflow-visible` so full text flows across stay dates without truncate clipping.
- **Solid Check-Out Caps**: Check-out morning bars use 100% solid `#222222` color with 0% opacity drop and NO `"Out"` text.
- **Label Priority**: `getChannelLabel(block)` evaluates `block.notes` ➔ `block.channelName` ➔ `block.reason` (e.g. `"Owner Stay / Maintenance"`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
