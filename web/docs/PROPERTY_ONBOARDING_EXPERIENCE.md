# Everloft Property Setup Dashboard — Onboarding Experience Design

**Status**: Design document (UX architecture, wireframes, algorithms, specs) — not yet built as
code. Like `docs/ARCHITECTURE.md`, `docs/DATABASE_DESIGN.md`, `docs/AUTH_RBAC_ARCHITECTURE.md`,
and `docs/DESIGN_SYSTEM.md` before it, this is the blueprint; the real, working Property CRUD
pages built earlier (`/dashboard/properties`, `/dashboard/properties/new`, `/dashboard/properties/
[id]`) are the simple v1 this onboarding experience is designed to eventually replace/extend, not
duplicate.
**Input**: one reference image (a purple-accented onboarding dashboard mockup) plus three
overlapping prompts — two describing a "dashboard of setup cards" experience, one describing a
traditional sequential 10-step wizard. §0 resolves that overlap into one recommended direction
rather than documenting three redundant, sometimes-contradictory specs.

---

## 0. Reconciling three prompts and one image into one direction

**The reference image, and two of the three prompts, describe the same thing**: a persistent
dashboard where all 10 setup sections are visible at once as cards, each independently
completable in any order, with a live completion ring, a listing preview, and a readiness score
— not a sequential step-1-of-10 wizard. **The third prompt describes the opposite**: a classic
Airbnb-style linear wizard (Step 2 of 10, Back/Continue, one section visible at a time).

**Recommendation: the dashboard-of-cards is the primary experience; the linear wizard is not
built as a separate mode.** Reasoning:
- The brief's own stated goal is explicit: support "first-time users **as well as** experienced
  property managers handling hundreds of properties." A strictly linear wizard is fine for one
  property; it becomes friction the moment a professional manager wants to jump straight to
  "Pricing" on property #47 without re-walking Basics→Location→Photos first. The dashboard
  already solves this — every card is independently reachable.
- A first-time host isn't actually harmed by the dashboard approach — the "Required" ordering
  (§8) and the AI Coach (§9) already guide them toward what to do next, achieving the wizard's
  guidance benefit without its rigidity cost.
- Building *both* a full dashboard and a full separate linear wizard would be two complete UIs
  for the same 10 data sections — real duplication for a real cost, not a "some users get mode A,
  some get mode B" benefit. The Property Management Module (`docs/PROPERTY_MANAGEMENT_MODULE.md`
  §8) already speced a 12-step wizard shape for a *different* reason — its full-featured Zod
  schemas per step already exist as real code (`features/properties/schemas/`) and are reused
  directly by each dashboard card's edit panel (§4) rather than rebuilt.
- Each setup **card**, when clicked, opens exactly the equivalent of one "wizard step" (a focused
  panel/drawer for that section alone) — so the *linear wizard's actual step content* isn't
  wasted, it becomes each card's expand target. This is why §4's `SetupCard` component's expanded
  state and the "wizard step" concept in the other module are the same underlying UI, reused, not
  two implementations.

**On the reference image's visual language vs. Everloft's own**: the image uses a purple/indigo
accent (`#6D5EF5`-ish) throughout. Per this brief's own instruction ("maintain Everloft's own
visual identity") and `docs/DESIGN_SYSTEM.md` §3 (already established: `--dash-primary` blue
`#2563EB`, not purple, not gold), this document reskins the reference's layout and information
architecture onto Everloft's already-defined dashboard tokens — same card shapes, same
information density, same right-column pattern, different (Everloft's actual) color system. No
new colors are introduced; nothing here needs a second design-system pass.

---

## 1. Design philosophy

Encourage, don't force. The dashboard always shows exactly where a host stands (completion %,
what's required vs. optional, estimated time left) and never blocks navigation between sections —
only blocks the final **Publish** action until required sections clear (§8). This is a direct,
deliberate improvement over Airbnb's own onboarding, which is more rigidly sequential — matching
this brief's explicit goal of feeling "more modern, intuitive, and scalable than Airbnb's
onboarding."

---

## 2. Layout (desktop, 3-column — per the reference image, reskinned)

```
┌─────────────┬──────────────────────────────────────────────┬──────────────────┐
│  Sidebar     │  Header: Property Name · Status · Completion │                  │
│  (permanent  │  Preview Listing · Save Draft · Publish       │  Right column:  │
│  nav)        │  ─────────────────────────────────────────── │  Live Preview    │
│              │  Completion Ring card (72%, Required/         │  Readiness Score │
│  Dashboard   │  Recommended remaining, Last Edited)          │  Required vs.    │
│  Property    │  ─────────────────────────────────────────── │  Recommended     │
│    Setup ←   │  10 Setup Section cards, one per row          │  AI Coach panel  │
│  Properties  │  (Property Basics, Location, Photos, Title,   │                  │
│  Reservations│   Description, Amenities, House Rules,        │                  │
│  Calendar    │   Pricing, Availability, Guest Requirements)  │                  │
│  Guests      │                                                │                  │
│  Finance     │                                                │                  │
│  Reports     │                                                │                  │
│  Maintenance │                                                │                  │
│  Housekeeping│                                                │                  │
│  Integrations│                                                │                  │
│  Settings    │                                                │                  │
│  ──────────  │                                                │                  │
│  User/Role/  │                                                │                  │
│  Logout      │                                                │                  │
└─────────────┴──────────────────────────────────────────────┴──────────────────┘
```

**Sidebar nav items map to real and future routes**: `Properties` → the already-built
`/dashboard/properties` list (this onboarding dashboard is what a specific property's row opens
into, e.g. `/dashboard/properties/[id]/setup`, distinct from the plain edit page already built);
`Reservations/Calendar/Guests/Finance/Maintenance/Housekeeping/Integrations` map 1:1 to future
modules already scoped in `docs/DATABASE_DESIGN.md` (Bookings, Guests, Revenue/Expenses,
Maintenance, Housekeeping) and this module's own `property_integrations` table (OTA); `Reports`
and `Settings` are existing/future dashboard-wide concepts, not property-specific.

---

## 3. The completion ring card (top of main column)

Circular progress (SVG stroke-dasharray animated on mount/update, §12), center: large percentage
+ "Property Complete" label. Beside it: three stat rows — **Required** (count remaining, red if
>0, green check if 0), **Recommended** (count remaining, amber), **Last Edited** (relative
timestamp, e.g. "2 minutes ago" — sourced from `properties.updated_at`, already a real column).
An **Estimated Time Remaining** figure (§6 explains how it's computed, not guessed) sits alongside.

---

## 4. Setup section card (the reusable component every one of the 10 sections uses)

```
[icon] Property Basics                         [In Progress]
       Property type, guest capacity, bedrooms, beds and bathrooms.
       ████████████████░░░░  85%                     [Continue ⌄]
       6 / 7 fields · Updated 2 minutes ago
```

**Fields, exactly**: icon (Lucide, category-colored per `docs/DESIGN_SYSTEM.md` §9), title, one-
line description, a horizontal progress bar (not just a number — the reference image gets this
right, a bar reads faster than a percentage alone), a `StatusChip` (§16's semantic mapping:
Completed=success, In Progress=info, Needs Review=warning, Not Started=neutral, Optional=neutral
outline), fields-completed count, relative last-updated time, and an action button whose label
changes with state (`Start` → `Continue` → `Review`), plus a chevron that expands the card
in-place (accordion, not a route navigation) to show the section's actual fields inline — reusing
that section's existing Zod schema/form fields from `features/properties/schemas/` (already real
code) rather than a new bespoke mini-form per card.

**Why expand-in-place instead of navigating to a separate page per section** (a deliberate
improvement over the reference image's `Review`/`Continue` buttons, which read as if they
navigate away): staying on the dashboard means the completion ring, live preview, and readiness
score all update **immediately** as a field changes, without losing the page's context — directly
serving the brief's "every interaction should feel dynamic" and "live listing preview refresh"
requirements. A route-per-section design would require either a full page reload or fairly
complex state-lifting to keep the ring/preview in sync; expand-in-place needs neither, since
everything lives in one page's client state.

---

## 5. The 10 sections, mapped to the real database (already built, from `docs/PROPERTY_MANAGEMENT_MODULE.md`)

| Section | Backed by (real tables) | Required for publish? |
|---|---|---|
| Property Basics | `properties.type_id`, `max_guests`, `bedrooms`, `bathrooms` + `property_rooms`/`beds` | ✅ Required |
| Location | `properties.country/city/address/latitude/longitude/google_maps_url` | ✅ Required |
| Photos | `property_photos` (thin junction to `files`, already live per `docs/STORAGE_ARCHITECTURE.md`) | ✅ Required (cover photo specifically) |
| Title | `properties.name`/`short_name` | ✅ Required |
| Description | `properties.description`/`short_description` | Recommended |
| Amenities | `property_amenities` (28 seeded amenities, live) | Recommended |
| House Rules | `property_rules`/`property_policies` | Recommended |
| Pricing | `property_pricing` (already live) | ✅ Required |
| Availability | `property_settings` (min/max stay, advance notice) + `property_availability_blocks` | ✅ Required |
| Guest Requirements | `property_settings.check_in_method` + new fields (§14, not yet on `property_settings`) | Recommended |

**This table is the single most load-bearing fact in this whole document**: every section's
"completion" is computable *today* by querying tables that already exist and already have real
RLS — this onboarding dashboard is a UI layer over data that's already real, not a new schema
effort.

---

## 6. Completion engine (per-section %, and the overall ring)

Each section's percentage is `(fields with a non-null/non-empty value) / (total fields in that
section, weighted)` — required fields within a section count double toward that section's own
percentage (so a section with 1 of 2 *required* fields done and 3 of 5 *optional* fields done
reads meaningfully closer to "half done" than a flat field-count average would suggest). The
**overall ring %** is a weighted average across all 10 sections, where the 6 "Required for
publish" sections (table above) carry more weight than the 4 recommended-only ones — this is
*why* a property with perfect Pricing/Location/Basics/Photos/Title/Availability but zero
Amenities still reads as, say, 85%+ rather than a flat 60% (6/10) — matching real-world urgency
(a guest cares far more about accurate pricing than a complete amenities list).

**Estimated Time Remaining**: not a guess — a small fixed per-field time budget (e.g. ~20 seconds
per simple field, ~90 seconds per photo, ~45 seconds per room/bed entry) summed across every
still-incomplete required+recommended field. Recomputed live as fields complete, so the estimate
visibly shrinks — a small, concrete trust-building detail worth calling out explicitly rather
than leaving as "some number."

---

## 7. Readiness Score (distinct from the completion ring — this is the improvement over Airbnb the brief asks for)

**Why two different numbers on the same screen isn't redundant**: the completion ring answers
"how much of the form have I filled out" (a data-entry metric). The **Readiness Score** answers
"how likely is this listing to actually perform well" (a quality/marketability metric) —
Airbnb doesn't separate these; Everloft explicitly should, per the brief. A property can be
100% *complete* (every field technically has a value) while still scoring low on *readiness* if,
say, only 3 photos exist against a recommended 20+, or the description is 40 characters.

**Formula** (category weights, summing to 100): Photos 25, Pricing 20, Description 15, Amenities
15, Availability 15, Basic Information 10. Each category's own sub-score is **not** the same as
its completion-ring percentage — e.g. Photos' readiness sub-score considers *photo count vs. the
recommended 20+* and *cover photo presence*, not just "is the Photos section's required field
(cover photo) filled." This is why the reference image's example shows "Photos 85%" under
Readiness while the completion ring shows a different, higher Photos-section completion — that
divergence is intentional, not a display bug, and should be called out in a tooltip
("Completion tracks required fields; Readiness reflects what actually helps bookings.").

---

## 8. Publish readiness logic

`Publish` button: disabled (with a tooltip explaining why, not just grayed out silently) until
**every "Required for publish" section from §5's table is at 100% completion** — Photos
specifically requires a cover photo set (`property_photos.is_cover`, already enforced as unique
per property by a real DB constraint from the Property Module migration), not just "at least one
photo." Recommended-only sections (Description, Amenities, House Rules, Guest Requirements) never
block Publish — they only affect the *Readiness Score*, which is shown alongside the Publish
button as a "your listing will score X/100 — consider finishing Y first" nudge, not a hard gate.
This two-tier gate (hard-required vs. soft-recommended) is what makes the dashboard "encourage
rather than force," per §1.

---

## 9. AI Property Coach — v1 logic (rule-based, not ML, and said so plainly)

Every "recommendation" in v1 is a deterministic rule against real data, presented with the same
three-part shape the brief asks for (Priority / Reason / Suggested Action):

| Rule (checked against real columns) | Priority | Message |
|---|---|---|
| `count(property_photos) < 20` | Medium | "Add {20-n} more photos — listings with 20+ photos convert noticeably better." |
| No photo tagged for a "core" room (kitchen/bathroom/bedroom missing) | High | "Kitchen photos are missing — add at least one." |
| `property_pricing.weekend_price is null` | Medium | "Weekend pricing hasn't been set — you're likely leaving weekend revenue on the table." |
| `length(properties.description) < 200` | Low | "Your description is shorter than most successful listings — add more detail about the space." |
| `count(property_amenities) < 10` | Low | "Guests frequently filter by amenities — you've selected fewer than most comparable listings." |

**Explicitly not built in v1, flagged as future (matches the brief's own "Future Ready" labels on
these exact items)**: photo blur/darkness/duplicate detection (§10) and true AI-generated title/
description suggestions — both need a real image-analysis or LLM integration, not a rule engine,
and shouldn't be faked with a placeholder that pretends to analyze a photo without actually doing
so.

---

## 10. Photo quality analysis (future, scoped honestly)

When built: a Cloudflare/serverless image-analysis step (blur via Laplacian variance, brightness
via mean luminance, duplicate detection via perceptual hashing compared against the already-real
`files.checksum`/a new perceptual-hash column) runs at upload time in the existing
`POST /api/files/upload` pipeline (`docs/STORAGE_ARCHITECTURE.md`), writing results into
`files.metadata` (already a flexible `jsonb` column — no schema change needed to add
`{blur_score, brightness_score, phash}` when this is built). Not attempted in this pass.

---

## 11. Checklist, Live Listing Preview, Quick Actions (right column, per the image)

**Checklist**: a flat ✔/✖ list mirroring the Required-section gate (§8) — a compressed, scannable
restatement of the same underlying state as the completion ring, not a separate data source.
**Live Listing Preview**: a card showing the current cover photo, name, city, (future) rating,
guest/bedroom/bed/bathroom counts, and price — every field sourced from the same `properties`/
`property_pricing`/`property_photos` rows the setup cards edit, re-rendered on every save (§13
covers exactly how "instantly" is achieved without a full page reload). **Quick Actions** (right
sidebar, per the third prompt): Continue Setup (jumps to the first incomplete required section),
Upload Photos (opens the Photos card directly), Preview Listing, Save Draft, **Duplicate
Property** and **Archive Property** — both already real, working actions from
`docs/PROPERTY_MANAGEMENT_MODULE.md` §4/§12 (duplicate explicitly does *not* clone pricing
overrides/documents/OTA integrations, per that document's business rule — worth restating here
since a user reaching "Duplicate" from this screen should get the same, not a different, behavior).

---

## 12. Interactions & animation (concrete values, not "subtle motion")

Reusing `docs/DESIGN_SYSTEM.md` §23's rules exactly (150ms fades, 250ms slides, no page-transition
animation) plus onboarding-specific additions:
- **Progress bar fill**: animates via CSS `transition: width 400ms ease-out` on value change —
  long enough to visibly register as "something updated," short enough not to feel laggy.
- **Completion ring**: `stroke-dashoffset` transition, same 400ms, with the center percentage
  number counting up/down via a `requestAnimationFrame` tween rather than snapping — small detail,
  large perceived-polish difference (this is the single highest-leverage "premium feel" animation
  in the whole screen, worth the extra implementation care).
- **Card expand/collapse**: `max-height`/`opacity` transition, 250ms, matching the Design
  System's drawer timing — not a new value invented for this screen.
- **Completion celebration**: once the ring hits 100%, a one-time (not repeating) confetti-free
  celebration — a brief scale+glow pulse on the ring itself plus a toast ("🎉 Ready to publish!")
  — deliberately restrained (no confetti canvas animation), consistent with `docs/DESIGN_SYSTEM.md`
  §1's "avoid excessive animation" rule for enterprise software.

---

## 13. Auto-save & state management

**Client state**: one React Query mutation per section (not per field) with a 600ms debounce
after the last keystroke/change in an expanded card — batches rapid edits into one save rather
than firing a request per keystroke. **Status indicator** (top-right of each expanded card, and
a global one near the header): `Saved` (default, small checkmark) → `Saving...` (spinner) on
debounce-fire → back to `Saved`, or `Failed — Retry` (button) on error, with a `navigator.onLine`
listener switching the whole dashboard to an **Offline Mode** banner that queues pending saves in
memory and flushes them on reconnect, rather than silently failing.
**Resume later**: `properties.updated_at` plus a new lightweight `last_edited_section` value
(stored on `property_settings` or a dedicated column — one text field, not a new table) drives
"take me back to where I left off" on next visit to this property's setup dashboard.

---

## 14. Validation rules

Every required field's validation already exists as real Zod code
(`features/properties/schemas/`, built in the Property Management Module pass) — this dashboard
doesn't invent new validation, it surfaces the *same* schemas' error messages inline within each
expanded card, exactly where the field lives (never a separate error summary panel). The one
field this document's Guest Requirements section needs that doesn't exist on `property_settings`
yet — `requires_government_id`, `requires_good_reviews`, `requires_host_approval` booleans — is
a 3-column additive migration when this dashboard is actually built, not a redesign.

---

## 15. Empty / loading / error states

- **Empty**: a section never shown as a blank card — "Not Started" status + the section's
  description doubles as its empty-state copy (no separate illustration needed for 10 small
  cards; reserve full empty-state treatment, per `docs/DESIGN_SYSTEM.md` §17, for genuinely empty
  *pages*, like the Properties list with zero properties, already built).
- **Loading**: skeleton cards matching the real card's shape (icon circle + two text bars + a
  progress-bar-shaped bar), never a spinner for the whole dashboard.
- **Error**: inline per-field (Zod message) for validation; a dashboard-level banner only for
  something structural (failed to load the property at all) — never a toast for a single field
  error, which the brief's own "Failed — Retry" auto-save indicator already covers per-section.

---

## 16. Design tokens

No new tokens — this screen is built entirely from `docs/DESIGN_SYSTEM.md`'s existing `--dash-*`
palette (§3), radius/shadow scale (§7-8), and typography (§4). The reference image's purple
becomes `--dash-primary` blue throughout (buttons, active nav item, progress ring stroke, links);
its light gray page background becomes the existing `background`/`muted` tokens; status pills use
the existing 5-bucket semantic mapping (§16 of that document) rather than the image's own ad hoc
colors.

---

## 17. Responsive behavior

**Desktop (`lg`+)**: the 3-column layout in §2. **Tablet (`md`)**: right column (Preview/
Readiness/Coach) collapses to a second row below the setup cards, single column each — not
hidden, since the live preview specifically is valuable feedback a tablet-using property manager
still wants. **Mobile (`<md`)**: single column, setup cards stacked, right-column content
(Preview/Readiness/Coach) becomes a swipeable or stacked section beneath the cards, and
Save Draft/Preview/Publish become a **sticky bottom action bar** (per the brief) rather than
inline header buttons, since header buttons would scroll out of reach on a long single-column
mobile page.

---

## 18. Accessibility

Every `SetupCard` is a real `<button>`-triggered disclosure (not a `<div onClick>`), so it's
keyboard-operable and announces its expanded/collapsed state via `aria-expanded` by construction
(Radix Accordion/Collapsible primitives, already the codebase's foundation per
`docs/DESIGN_SYSTEM.md` §22). The completion ring's percentage is duplicated as visible text (not
color/shape alone) for screen readers and colorblind users. The Publish button's disabled state
has an `aria-describedby` pointing to the specific missing-requirements list (§11's checklist),
so a screen-reader user gets "why can't I publish" without hunting for it.

---

## 19. Component hierarchy

```
PropertySetupDashboard
├── SetupDashboardHeader (name, status chip, completion %, Preview/Save/Publish buttons)
├── CompletionRingCard (ProgressRing + Required/Recommended/Time/LastEdited stats)
├── SetupSectionList
│   └── SetupCard × 10 (icon, title, description, ProgressBar, StatusChip, expand → that
│       section's real Zod-schema-backed form fields inline)
└── RightColumn
    ├── LiveListingPreviewCard
    ├── ReadinessScoreCard (ring + per-category breakdown + suggestions)
    ├── RequiredVsRecommendedCard (two progress bars)
    ├── AIPropertyCoachCard (rule list, §9)
    └── QuickActionsPanel (Continue/Upload Photos/Preview/Save/Duplicate/Archive)
```

Shared primitives reused, not reinvented: `ProgressRing`, `SetupCard`, `StatusChip` (extends the
existing badge component), `DataTable`/`Button`/`Select` etc. from the already-built dashboard UI
kit and `docs/DESIGN_SYSTEM.md`.

---

## 20. Future scalability

- **Bulk/portfolio view**: a property manager with hundreds of properties needs a "which of my
  properties are below 80% readiness" cross-property view — a natural extension of the
  `/dashboard/properties` list (already built) adding a Readiness Score column, not a new page.
- **AI title/description generation and photo quality analysis** (§9-10): the clearest, most
  valuable next real-ML integration — both are additive to `files.metadata`/`properties`
  columns, no schema redesign required when built.
- **SEO scoring** (title/description): same additive pattern — a `seo_score` derived value, not
  stored, computed on read from existing text fields plus `property_seo` (already live).

---

## What this document is, honestly

A complete, reconciled UX/interaction/algorithm specification — not yet a single line of new UI
code. Every data point it references (photo counts, pricing fields, amenity counts, room/bed
detail) is already real and queryable today (`docs/PROPERTY_MANAGEMENT_MODULE.md`), which is
exactly why building this for real, when asked, is a UI-and-algorithm project layered on existing
data — not a new backend effort.
