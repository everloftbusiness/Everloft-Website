# Repo map — read this before exploring anything else

This repo contains **two separate frontends**. Don't confuse them.

- **`web/`** — the live, active site. Next.js/TypeScript/Tailwind. This is what runs on
  `localhost:3000`, what gets worked on, what has the real ported content and the 11-role
  dashboard. Its own `web/AGENTS.md` / `web/CLAUDE.md` have the full technical detail.
- **Everything else at this root** (`index.html`, `dashboard.html`, `js/`, `css/`, `screens/`,
  `dashboard/`, `images/`, etc.) — the **old static "Hyperspace" site**, kept only as a reference
  source for real content/credentials/business logic that was ported into `web/`. It is not
  being developed further. Don't edit it, don't scaffold new features in it, don't spend
  exploration budget grepping it unless the task is specifically "find X in the old site to
  port forward."

If a task is about the website, layout, dashboard, booking flow, or any page — the work happens
in `web/`. Scope file searches to `web/` by default.

---

## Quick Reference Cheat Sheet

### 1. Dev Server & Build Commands
- **Dev Server (Windows/PowerShell):** `npm.cmd run dev` (run inside `web/`)
- **Typecheck:** `npx.cmd tsc --noEmit` (run inside `web/`)
- **Production Build:** `npm.cmd run build` (run inside `web/`)

### 2. Key URLs
- **Local Site URL:** [http://localhost:3000](http://localhost:3000)
- **Browse Properties (Grid & Map):** [http://localhost:3000/properties](http://localhost:3000/properties)
- **Properties Map View:** [http://localhost:3000/properties?view=map](http://localhost:3000/properties?view=map)
- **Property Details Sample:** [http://localhost:3000/properties/villa-zephyr](http://localhost:3000/properties/villa-zephyr)
- **Contact & Inquiries:** [http://localhost:3000/contact](http://localhost:3000/contact)
- **Login Page:** [http://localhost:3000/login](http://localhost:3000/login)
- **Properties List (Dashboard):** [http://localhost:3000/dashboard/properties](http://localhost:3000/dashboard/properties)
- **Add Property:** [http://localhost:3000/dashboard/properties/new](http://localhost:3000/dashboard/properties/new)
- **Super Admin Workspace:** [http://localhost:3000/dashboard/super-admin](http://localhost:3000/dashboard/super-admin)
- **Platform Overview:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

### 3. Seeded Test Accounts (Supabase Auth)
| Role | Email / Username | Password | Notes |
|---|---|---|---|
| **Super Admin** | `superadmin@everloft.co.in` | `Ever@123` | Full system access, property setup, financials |
| **Operations Manager** | `opsadmin@everloft.co.in` | *(same / reset)* | Operations & bookings overview |
| **Property Owner** | `owner01@everloft.co.in` | *(same / reset)* | Revenue waterfall, bookings, owner statements |
| **Investor** | `investor01@everloft.co.in` | *(same / reset)* | Portfolio value, returns, equity distribution |
| **Housekeeping** | `housekeep01@everloft.co.in` | *(same / reset)* | Cleaning tasks & room readiness |
| **Maintenance** | `maint01@everloft.co.in` | *(same / reset)* | Repair tickets & work orders |
| **Guest** | `guest01@everloft.co.in` | *(same / reset)* | Stay details, digital key, concierge |

*Password recovery / resets can be done via [http://localhost:3000/forgot-password](http://localhost:3000/forgot-password) or the Supabase project dashboard (`cvgrwujjaakqrxasixyf`).*

---

## Key Core Architectural Conventions (Do Not Violate)

1. **Pricing & Tax Transparency (+ GST)**:
   - Base nightly rates are displayed with **`+ GST`** badge across all cards, listings, and details pages.
   - Interactive booking breakdowns explicitly itemize **`GST & Taxes (18%)`** and total as **`Total (inc. GST)`**.
   - Dashboard setup pricing inputs are labeled `(excl. 18% GST)`.

2. **Storage Physical Deletion**:
   - Deleting a photo or video removes both the database record AND permanently deletes the binary object from Cloudflare R2 / physical bucket via `deleteObject(fileRow.bucket, fileRow.object_key)`.

3. **Live Interactive Maps (Leaflet)**:
   - No static wireframe placeholders. All maps are live Leaflet instances (CartoDB Voyager + Google Satellite Hybrid):
     - `PropertyLocationMap` (`web/src/components/property/property-location-map.tsx`) — Guest property page (`/properties/[slug]`).
     - `PropertiesMapView` (`web/src/components/property/properties-map-view.tsx`) — All properties browse page (`/properties?view=map`).
     - `ContactOfficeMap` (`web/src/components/contact/contact-office-map.tsx`) — HQ contact page (`/contact`).
     - `InteractiveLocationMap` (`web/src/components/dashboard/properties/setup/interactive-location-map.tsx`) — Onboarding setup step.

4. **Navbar Transparency Rule**:
   - `solid = !isHomePage || scrolled || open` in `navbar.tsx`.
   - Only `pathname === "/"` is transparent at the very top. All inner pages enforce dark text and dark logo against frosted backdrop.

5. **Property Page Section Sequence**:
   - `Gallery` ➔ `Key Specs (BHK, Max Guests, Baths, Sqft)` ➔ `Managed Guarantee` ➔ `About & Highlights` ➔ `What This Place Offers (Amenities)` ➔ `Where You'll Sleep (Bedrooms)` ➔ `Location Map` ➔ `House Rules` ➔ `Spaces Tour` ➔ `Video Tour`.

6. **Multi-Calendar & iCal Sync Architecture (`property-calendar-grid.tsx` & `ical-sync.service.ts`)**:
   - **Exclusive PMS End-Date Logic**: Blocks span `[startDate, endDate)`. A 1-night block on `2026-09-10` sets `startDate: 2026-09-10` & `endDate: 2026-09-10` in DB, but `getEffectiveBlockDates()` calculates `endYmd = 2026-09-11` for check-out AM.
   - **Continuous Horizontal Bar Layout**: Multi-day stay bars float at `z-20 -mx-[9px] w-[calc(100%+18px)]` to overlay 1px grid borders with 0 narrow line gaps.
   - **Uncut Text Flow**: Check-in labels (e.g. `Owner Stay / Maintenance`) use `whitespace-nowrap overflow-visible` to flow smoothly across stay dates without truncate clipping.
   - **Clean Check-Out Caps**: Check-out morning bars render in 100% solid `#222222` with 0% opacity drop and NO `"Out"` text.
   - **Label Resolution**: `getChannelLabel(block)` checks `block.notes` ➔ `block.channelName` ➔ `block.reason` (e.g. `"Owner Stay / Maintenance"`).

