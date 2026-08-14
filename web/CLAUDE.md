@AGENTS.md

# Everloft `web/` — project notes

Premium hospitality booking platform for Everloft, rebuilding the static site at the repo
root. Read this before touching the codebase — it captures environment quirks and version
gotchas that cost real time to discover the first time around.

**Before building any new business-domain feature (bookings, revenue, expenses, documents,
reports, etc.), read `docs/ARCHITECTURE.md` first.** It's the official target architecture —
feature-based `features/<domain>/` folders, service-layer rules, naming conventions, the whole
blueprint — and it explicitly documents which parts of today's codebase already conform to it
vs. which are legacy layout kept as-is (the dashboard system) per its own §17. Don't invent a
different structure for a new feature; don't re-derive these decisions from scratch.

**Before writing any new migration beyond Authentication/RBAC, read `docs/DATABASE_DESIGN.md`
first.** It's the official target schema for all 15 business modules (properties, owners,
investors, bookings, guests, revenue, expenses, housekeeping, maintenance, utilities, CRM,
notifications, reports, system) with every table's columns, relationships, and indexes already
designed — including three deliberate normalization calls worth knowing before "fixing" them
(unified `transactions` ledger instead of per-module payment tables, unified `utility_bills`
instead of per-utility-type tables, unified `vendors` shared across expenses/maintenance/
utilities). §21 reconciles it against what's actually live today.

**Before touching auth, sessions, permissions, or building any of the Security Settings/Active
Sessions/Role Management/User Management screens, read `docs/AUTH_RBAC_ARCHITECTURE.md` first.**
It documents exactly what's live today (Supabase Auth, RLS, 11 roles, multi-role support via
`user_roles`, 7 real accounts) versus real gaps with ready-to-run SQL (`login_history`,
`user_devices`, expanded `profiles` columns, expanded `status` values, a granular CRUD-level
permission catalogue) — §17 lists exactly what's safe to apply immediately vs. what needs a
decision first. Don't hand-roll rate limiting/lockout/session management from scratch without
reading its §7 and §11 — the design (and the reason Supabase Auth's own session store isn't
duplicated with a custom table) is already worked out there.

**Before styling anything under `/dashboard/*`, read `docs/DESIGN_SYSTEM.md` first — especially
§0.** The public marketing site (gold accents, warm hospitality feel) and the internal platform
(`/dashboard/*`) are **deliberately two different visual languages for two different audiences**
— this is not a conflict to "resolve" toward one look. The dashboard uses a `--dash-*` prefixed
token set (blue primary, not gold; tighter radii/shadows/spacing than the marketing site) added
*alongside* the existing marketing tokens in `globals.css`, never replacing them. Don't restyle
marketing pages to match this doc, and don't reach for `--gold` on a dashboard screen.

**Before touching the Property Setup Dashboard (`/dashboard/properties/[id]/setup`), read
`docs/PROPERTY_SETUP_DASHBOARD_V2_IMPROVEMENTS.md` first.** It's the v2 build spec from real
hands-on testing feedback — includes two diagnosed real bugs with root causes (Next.js's default
1MB Server Action body limit silently capping photo uploads; missing `R2_PUBLIC_BASE_URL`
breaking photo previews, fixable today via signed URLs), the full expanded amenities (~200 items,
15 categories) and house rules (~65 presets + custom free-text) lists to reseed, a 6-group
pricing field expansion with two new proposed tables (`property_discounts`, `property_fees`),
and step-by-step Google Maps API setup instructions for the Location section's map integration.
Nothing in it is built yet — it has a priority order for when it is.

**Before touching properties in general, read `docs/PROPERTY_MANAGEMENT_MODULE.md` first — the schema is
real, applied code (14 migrations, `20260731000001`-`20260731000014`), the UI/API are specified
but not built.** The `properties` foundation table was expanded with full info/location/spec
fields, `type`/`status` promoted to lookup tables, and ~20 new child tables added (ownership
junctions, rooms/beds, media, rules/policies, pricing, utilities, OTA integrations — see its §1
for the full list). `features/properties/schemas/` has real, working Zod validation for all 11
wizard steps. RLS uses a new `can_view_property()` helper, same pattern as `authorize()`/
`has_role()`. Don't rebuild any of this schema from scratch, and don't confuse `property_pricing`
(the property's own rate card) with a future booking/revenue transaction table — that
distinction is deliberate, explained in its §12.

**Before building the Property Setup Dashboard / onboarding experience, read
`docs/PROPERTY_ONBOARDING_EXPERIENCE.md` first.** It reconciles three overlapping specs (a
dashboard-of-cards design and a sequential-wizard design) into one recommended direction — the
dashboard-of-cards wins, the wizard's step content becomes each card's expand target, not a
separate mode — and its own §0 explains why. Every data point it references (photo counts,
pricing, amenities, rooms/beds) already exists in the real Property Management Module schema;
this is a UI/algorithm layer on top of existing data, not a new backend effort. Don't confuse
this with the already-built simple `/dashboard/properties` CRUD pages — this document designs
what that flow could grow into, it doesn't replace it yet.

**Before touching file uploads/storage, read `docs/STORAGE_ARCHITECTURE.md` first — this one is
real, applied code, not just a design doc.** The `files` table was expanded (live migration
`20260730000009`) with `owner_type/owner_id` (renamed from `entity_type/entity_id`),
`folder_path/checksum/thumbnail_key/status/metadata/version/previous_version_id`, and a 20-bucket
check constraint. `lib/storage/r2.ts` + `lib/storage/file-service.ts` + all 12 route handlers
under `app/api/files/**` (upload/list/metadata/delete/rename/restore/replace/copy/move/download/
signed-url/public-url) are real, working, type-checked code — don't rebuild any of these from
scratch. The one missing piece is real Cloudflare R2 credentials (`.env` still has placeholders)
— nothing moves actual bytes until those are supplied, same as Supabase before it was linked.

## Environment

- **Node.js is not on PATH by default in this shell.** Every PowerShell command that needs
  `node`/`npm`/`npx` must prefix: `$env:Path += ";C:\Program Files\nodejs"`. Bash tool calls
  need `export PATH="$PATH:/c/Program Files/nodejs"`. This is a per-invocation shell quirk,
  not a permanent PATH problem — it's already correctly set in the machine's System PATH.
- **Git Bash mangles leading-`/` arguments** into Windows paths (e.g. `/properties` becomes
  `C:/Program Files/Git/properties`). Set `MSYS_NO_PATHCONV=1` before any command that passes
  a literal URL path or similar leading-slash argument.
- **Dev server**: `npm run dev` from `web/`. Next 16 uses a lockfile — only one `next dev` can
  run per project; `taskkill` the stale PID (shown in the error) before restarting. Run it via
  the Bash tool's `run_in_background: true` directly (not `cmd &` wrapped in a script — a
  backgrounded child of a finished wrapper command gets reaped and dies).

## Stack versions (intentionally not what the original spec said)

- **Next.js 16** (latest stable, not "15") — `params`/`searchParams` are `Promise`s everywhere
  (`await` them in every page/layout), `next/image` uses `remotePatterns` not `domains`,
  `middleware.ts` is renamed `proxy.ts` (not in use yet, N/A unless auth-guarding routes).
- **Tailwind v4**, CSS-first config — no `tailwind.config.ts`. All design tokens live in
  `src/app/globals.css` under `@theme inline` / `:root` / `.dark`. Brand palette: `--primary`
  `#0F172A`, `--gold` `#D4AF37`, `--blue-accent` `#2563EB`, `--soft` `#F8FAFC`. Custom utility
  classes: `.site-container` (1440px), `.section-padding`, `.eyebrow`, `.heading-display`.
- **shadcn/ui CLI v4** — different from the CLI you may remember. `-b radix` base, `nova`
  preset. Components live in `src/components/ui/`. **`npx shadcn add <x> --overwrite` silently
  wipes custom edits to shared files it touches** (already happened once to `button.tsx`) — if
  you add/re-add a shadcn component, check `git diff` on files it lists as "Updated" and
  reapply: the `gold` / `gold-outline` / `blue-accent` button variants and the `xl` size.
- **Prisma 7** — requires an explicit driver adapter even for SQLite (`new PrismaClient()`
  with no adapter throws at runtime). This project uses `@prisma/adapter-better-sqlite3` via
  `src/lib/prisma.ts` and `prisma/seed.ts`. Generator is `provider = "prisma-client"` (new
  ESM TS client) outputting to `src/generated/prisma` (gitignored) — import from
  `@/generated/prisma/client`, not `@prisma/client`. Local db file is `web/dev.db` (project
  root, not `prisma/dev.db` — `DATABASE_URL=file:./dev.db` in `.env` resolves relative to
  `web/`, both for the CLI and at runtime). Seed with `npx prisma db seed`. Project-scoped
  Prisma skills are installed under `.claude/skills/prisma-*` — consult
  `prisma-driver-adapter-implementation` and `prisma-upgrade-v7` before changing anything
  Prisma-related, they contain details not inferable from reading this codebase alone.
- **lucide-react v1.x removed all brand/social icons** (Facebook, Instagram, Twitter/X,
  LinkedIn, YouTube, etc. — package no longer exports them at all). Use
  `src/components/icons/social-icons.tsx` (hand-drawn inline SVGs matching lucide's stroke
  style) instead of importing them from lucide.
- **react-day-picker v10** powers the shadcn `Calendar` — `mode="range"` gives
  `{ from?, to? }`.

## Design/content decisions carried forward

- **Fictional property catalog is intentional; everything else is real.** The 8 villas/homes
  seeded in Prisma (Villa Zephyr, Gokarna Cliffside Villa, etc.) are invented — the legacy site
  never had a public bookable property catalog, so there was nothing real to port for that part.
  Everything else on the marketing pages (tagline "Handled with Purpose.", real address/phone/
  email, the Owner Program's 2 partnership models + challenges + FAQ, the Investor Program's 3
  investment models, the DPIIT/Kerala Startup Mission certifications, the "Dual Collaboration
  Model" business-model copy) is real content ported verbatim from the legacy site — see "Real
  business facts" below. Don't regenerate invented copy for those sections; the real copy lives
  inline in `src/app/(site)/property-management/page.tsx` and `investor-program/page.tsx`.
- **No real property photography exists** (the legacy site's `/images` only has candid phone
  snapshots, one showing a TV's Netflix menu) — fine for the invented property catalog, which
  uses `<PropertyMedia seed="..." />` (`src/components/media/property-media.tsx`, a deterministic
  gradient+grain+icon placeholder). But 5 of those legacy photos **are** genuine Everloft content
  and are used for real: `public/images/pic01-05.jpg`, shown on the homepage ("Experience
  Everloft" section) and available for reuse elsewhere. The wordmark (`src/components/logo.tsx`)
  is a clean typographic mark replacing the legacy green clip-art logo — that decision stands.
- **Razorpay / Google Maps / Cloudinary are wired but not live.** No API keys configured for
  these three specifically. Booking payment step checks `NEXT_PUBLIC_RAZORPAY_KEY_ID`; when
  unset it shows a labeled "Demo Payment" button (`src/components/booking/booking-flow.tsx`).
  Map sections render `PropertyMapPlaceholder` (illustrative SVG + pins), clearly labeled as
  illustrative. **Contrast this with the contact form, login, and super-admin property data —
  those three ARE live/real, see below.**
- Data flows straight from Prisma in server components (`src/lib/properties.ts`,
  `src/lib/bookings.ts`) for the invented property catalog — no separate mock-data layer there.

## Real business facts (do not invent alternatives to these)

- Tagline: **"Handled with Purpose."** (capital P). Meta title: "Premium Stays. Thoughtfully
  Managed." Address: "1st Floor, Bose Nagar, Kadavanthara, Ernakulam, Kerala 682020". Phone:
  "+91 74832 70264" / display `(+91) 748-327-0264`. Email: `everloft.business@gmail.com`.
  Facebook: `facebook.com/share/182zDazKm4`. Instagram: `instagram.com/everloft.co.in`.
- Certifications: **DPIIT Recognition (Startup India)** and **Kerala Startup Mission**
  accreditation — real certificate images at `public/certificates/dpiit-certificate-preview-
  rotated.png` and `company-document-preview.png` (full-res PDFs exist at the repo root
  `certificates/` if higher quality is ever needed).
- Business model: Everloft runs a **"Dual Collaboration Model"** — Full Management (Everloft
  handles everything) or Commission-Based Partnership (owner stays involved) — and lists
  directly on its own platform *while also* maintaining listings on Airbnb/Booking.com/
  MakeMyTrip/Goibibo for visibility. This is real and intentional; don't "correct" it toward a
  direct-booking-only narrative on the Owner/Investor pages specifically (the guest-facing
  booking-platform framing elsewhere is fine, it's just not the whole real business).
  Investor Program has **3 real investment models** (Development & Primary Share, Long-Term
  Lease & Value Creation, Asset Management Partnership) — see the page for full copy.

## Live 3rd-party integrations (real credentials, already in production)

These came from the legacy site's `screens/login/code/screen/login.model.js`,
`screens/home/code/screen/home.model.js`, and `js/sheets.config.js` — carried over verbatim,
not reissued.

- **`GOOGLE_CONTACT_SCRIPT_URL`** (`.env`) — a Google Apps Script web app the contact form
  forwards to (`src/app/api/contact/route.ts`), in addition to saving to our own Prisma
  `ContactMessage` table. Field names it expects: `name`, `email`, `contact_number`, `message`.
  Still live and unrelated to the auth migration below.
- **`NEXT_PUBLIC_EVERLOFT_SPREADSHEET_ID`** (`.env`) — Everloft's real, live Google Sheet
  (public "Anyone with the link: Viewer"), read via the `gviz/tq?tqx=out:json` endpoint —
  ported to `src/lib/dashboard/sheets.ts` (server-side only, which conveniently sidesteps the
  CORS/sign-in issues the legacy client-side fetch had to work around). Real tabs: `Bookings`,
  `Assets`, `Revenue`, `Expenses`, `Maintenance`, `Payouts`, `Admin_Signups`, `Notes`,
  `New_Assets`. Only the Super Admin's "Managing Properties" table
  (`src/components/dashboard/managing-properties-table.tsx`) and the property drill-down page
  (`/dashboard/property/[assetId]`, `src/lib/dashboard/property-detail.ts`) actually read this
  live — every other role's dashboard numbers are illustrative mock data (see below).
- **Login no longer goes through Google Apps Script.** It was fully migrated to Supabase Auth
  (see "The PMS foundation" below) at the user's explicit request, once the platform pivoted
  from "premium booking site" to "Hospitality Asset Management Platform." The
  `GOOGLE_LOGIN_SCRIPT_URL` credential is retired — don't resurrect it or re-add a route that
  calls it.

## The PMS foundation (Supabase Auth + Postgres RBAC) — replaces the old JWT/Google-Script auth

Built when the project scope expanded from "premium booking site" to "international Hospitality
Asset Management Platform" (Guesty/Hostaway-style PMS + Owner/Investor portals). This replaced
the custom-JWT-plus-Google-Script login **in place** — the user explicitly chose full migration
over running both side by side (see conversation: "Replace web/'s backend in place" +
"Fully migrate to Supabase Auth").

- **Schema**: `supabase/migrations/*.sql`, applied in order via `supabase db push`. Every table
  has `id uuid`, `created_at`/`updated_at`/`created_by`/`updated_by`, and `deleted_at` (soft
  delete only — nothing is ever hard-deleted). Tables: `roles`, `permissions`,
  `role_permissions`, `profiles` (1:1 with `auth.users`, auto-created by a trigger on signup),
  `user_roles` (many-to-many, one `is_primary` per user), `activity_logs`, `audit_logs`
  (populated automatically by the generic `record_audit_log()` trigger — attach it to any new
  table with one `create trigger` line, no per-feature audit code), `notifications`, `files`
  (metadata for R2 objects), and `properties` (foundation only — identity/location/ownership,
  deliberately no pricing/booking columns yet).
- **RBAC is data, not code.** `supabase/migrations/20260730000008_seed_rbac_data.sql` seeds the
  same 11 role slugs the dashboard already used (`super_admin` … `investor`, see
  `src/lib/dashboard-roles.ts`) plus a permission catalogue and default grants. Adding a "Future
  Custom Role" or rebalancing a grant is an `INSERT`/`UPDATE`, never a code change. Two
  permission vocabularies exist by design and are **not** the same thing — don't conflate them:
  - `permissions`/`role_permissions` (DB) — the real authorization boundary, enforced by
    Postgres RLS via the `authorize(permission_key)` / `has_role(role_slug)` SQL functions
    (`supabase/migrations/20260730000004_user_roles.sql`).
  - `ROLE_PROFILES.permissions` (`src/lib/dashboard/role-profiles.ts`) — presentation-only,
    controls which *sections of the legacy-ported analytics dashboard UI* a role sees. Safe to
    leave exactly as it was; it isn't a security boundary since RLS already protects the data
    underneath regardless of what the UI chooses to render.
- **RLS is on for every table.** Policies generally follow: see your own rows, or see everything
  if you hold the relevant `manage_*`/`view_*` permission. `notifications` inserts and
  `audit_logs` inserts intentionally have **no** policy for regular users — they're written by
  the service-role key or by security-definer trigger functions (which run as the owning role
  and bypass RLS), never directly by client code.
- **Session/auth flow**: `/login` (email+password via React Hook Form + Zod) →
  `POST /api/auth/login` calls `supabase.auth.signInWithPassword` → session cookies via
  `@supabase/ssr` (`src/lib/supabase/server.ts`), downgraded to session-only cookies if
  "Remember me" is unchecked. `src/proxy.ts` (Next 16's renamed `middleware.ts`) refreshes the
  session and gates `/dashboard/*` on every request. `getDashboardSession()`
  (`src/lib/dashboard/session.ts`) still returns the **same shape** the dashboard UI has always
  consumed (`{ username, role, roleLabel, roleSlug }`, now with `userId`/`email`/`permissions`
  added) — internals changed, no downstream dashboard code needed touching. Password
  reset/email verification/future magic-link/Google OAuth all funnel through
  `src/app/auth/callback/route.ts`. Self-registration is intentionally off
  (`enable_signup = false` in `supabase/config.toml`) — see README "Create your first user" for
  how to provision the first Super Admin.
- **Storage**: `src/lib/storage/r2.ts` — Cloudflare R2 (S3-compatible), 11 buckets matching the
  `files` table's check constraint, 20MB image / 500MB video limits, automatic WebP
  conversion + compression for image buckets via `sharp`, signed URLs for private buckets.
  Generic upload endpoint: `POST /api/files/upload`.
- **Basic dashboard overview**: `/dashboard` now renders `DashboardOverview`
  (`src/components/dashboard/dashboard-overview.tsx`) for `super_admin`/`tech_admin` — real
  Postgres counts (properties/users/owners/investors), real `activity_logs`-backed recent
  activity and latest logins, and an honest system-status panel (checks env vars, doesn't fake
  uptime numbers). Occupancy/revenue are explicit placeholders — those modules don't exist yet.
  Every other role still redirects to its existing `/dashboard/{role-slug}` analytics workspace,
  untouched.
- **Two databases, on purpose (for now)**: the PMS foundation above lives in Supabase Postgres;
  the marketing site's property listings/reviews/leads still live in the separate Prisma+SQLite
  layer (`src/lib/prisma.ts`). Consolidating onto one Postgres instance (pointing Prisma at the
  same Supabase connection string) is future work, not done in this pass — booking/revenue
  modules were explicitly out of scope for the foundation build. Don't assume they're already
  merged.
- **Folder structure direction**: the spec for this foundation asked for a feature-based layout
  (`/features/auth`, `/features/properties`, etc.). The existing, already-verified codebase uses
  a component-type layout instead (`components/dashboard`, `components/site`, `lib/dashboard`).
  Rather than a risky mass-reorg of working code in this pass, new foundation code follows a
  clear domain split under `lib/` (`lib/supabase`, `lib/rbac`, `lib/storage`) and that's the
  intended direction for new modules too — don't force old files into `/features/*` retroactively
  without discussing it first.

## The dashboard system (`/dashboard/*`) — an entire ported internal tool, not new scope

The legacy site had a full 11-role internal management dashboard (`dashboard/roles/*/index.html`
+ ~14,500 lines of JS across `screens/dashboard/` and `js/`) that a first pass at this rebuild
completely missed — it only surfaces if you go looking, since the original ask ("build a
premium booking platform") reads like a pure marketing site. If asked to touch anything under
`/dashboard`, know that:

- **Auth**: Supabase Auth session cookies (not the legacy's `sessionStorage`, and no longer the
  custom-JWT-plus-Google-Script flow either — see "The PMS foundation" above for the current
  auth architecture). `src/lib/dashboard-roles.ts` is now just the shared role-slug/label
  vocabulary; role resolution itself is a DB lookup (`user_roles` → `roles`), not string-parsing
  heuristics. `src/lib/dashboard/session.ts`'s `getDashboardSession()` reads the Supabase session
  server-side and returns the same shape this UI has always consumed.
- **11 roles**: `super_admin, finance_admin, operations_manager, tech_admin, property_manager,
  guest_support, property_owner, investor` share one generic shell (`GenericDashboard`,
  `src/components/dashboard/generic-dashboard.tsx`) with permission-gated sections (ported from
  `roleProfiles` in the legacy presenter — see `src/lib/dashboard/role-profiles.ts`) plus a
  per-role "workspace" card/table (`src/lib/dashboard/workspaces.ts`). `guest, housekeeping,
  maintenance` are **isolated views** — fully bespoke, interactive pages
  (`src/components/dashboard/roles/{guest,housekeeping,maintenance}-dashboard.tsx`) with their
  own task lists, checklists, status updates, and expense-claim flows, matching the legacy's
  `isolatedView: true` roles.
- **Almost all financial/performance numbers shown are illustrative mock data**, not live —
  this matches the legacy system exactly (`buildPayload()` in `src/lib/dashboard/mock-engine.ts`
  is a port of the same demo revenue/occupancy model, explicitly labeled "(sample)"/
  "illustrative" throughout in both the old code and this port). The **only** real/live data
  anywhere in the dashboard is the Super Admin's Managing Properties table + property
  drill-down (see previous section) — don't "fix" the mock numbers to look more real, and don't
  assume other roles' numbers are wired to Sheets just because Managing Properties is.
- Route structure: `/dashboard` redirects to `/dashboard/[roleSlug]` based on the session's
  role (mismatched URL role slugs redirect to the correct one — stricter than the legacy's
  client-trust model, intentionally). `/dashboard/property/[assetId]` is Super Admin-only.

## Route structure

Pages live under `src/app/(site)/` (a route group, invisible in URLs) so `src/app/layout.tsx`
can stay minimal (fonts, JSON-LD, toaster) while `src/app/(site)/layout.tsx` adds the marketing
Navbar/Footer — this excludes `/dashboard` (its own header, no marketing chrome) and `/api`
from that chrome. If Windows `mv`/git-bash `mv` refuses to move a directory containing a
`[bracket]` route folder ("Permission denied" even after killing node), use PowerShell
`Move-Item -LiteralPath` instead — it handles the bracket correctly where git-bash `mv` doesn't.

## Gotchas hit during the build (avoid re-discovering)

- `StatCard`/`AnimatedCounter` must use `text-current`, never a hardcoded color class like
  `.heading-display`'s `text-primary` — it's used inside both light and dark (`bg-primary
  text-white`) sections, and a hardcoded dark color renders invisible on a dark background.
- shadcn's `TabsTrigger` defaults to `flex-1` (fills available row width). When rendering a
  wrapped/pill-style tab list where the last row has one lone item, add `flex-none` in the
  trigger's `className` override or it stretches full-width.
- Reveal/scroll animations (`src/components/motion/reveal.tsx`, Framer Motion `whileInView`)
  won't have fired in a screenshot taken immediately after `page.goto()` — programmatically
  scroll through the page first (or the section genuinely won't render) before trusting a
  full-page screenshot for visual QA.
- **Navbar solid state**: `solid = !isHomePage || scrolled || open`. All non-home pages must have
  solid headers so text and logo are dark and visible against standard light backgrounds.
- **Tax disclosure (+ GST)**: All pricing displays across public cards, search results, details pages,
  and mobile bars must include `+ GST`. Booking widget must calculate and itemize `GST & Taxes (18%)`.
- **Physical R2 Deletion**: Deleting photos or videos calls `deleteObject(fileRow.bucket, fileRow.object_key)`
  in `onboarding.actions.ts` to prevent stranded storage assets.
- **Live Maps**: All maps are live Leaflet instances (CartoDB Voyager + Google Satellite Hybrid):
  `PropertyLocationMap` (property details), `PropertiesMapView` (`/properties?view=map`),
  `ContactOfficeMap` (`/contact`), `InteractiveLocationMap` (dashboard setup). No wireframe placeholders.
- **Property Page Section Sequence**:
  `Gallery` ➔ `Specs (BHK, Guests, Baths, Sqft)` ➔ `Managed Guarantee` ➔ `About & Highlights` ➔
  `What This Place Offers (Amenities)` ➔ `Where You'll Sleep (Bedrooms)` ➔ `Location Map` ➔
  `House Rules` ➔ `Spaces Tour` ➔ `Video Tour`.

