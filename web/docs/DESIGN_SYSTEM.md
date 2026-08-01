# Everloft Enterprise Platform Design System

**Status**: Official design system for the Everloft **platform** (`/dashboard/*` — Admin,
Property Management, Bookings, Owner Portal, Investor Portal, Finance, Revenue, Housekeeping,
Maintenance, CRM, Reports, Analytics).
**Scope**: design tokens and component specifications only — no business features, no backend,
no database (see `docs/ARCHITECTURE.md` and `docs/DATABASE_DESIGN.md` for those).
**Read §0 first** — it resolves what would otherwise be a real conflict with the existing,
already-built public marketing site.

---

## 0. Two brands, one company — read this before any token below

Everloft's public marketing site (home, properties showcase, Owner Program, Investor Program,
about, contact — everything under the `(site)` route group) already has a real, shipped visual
identity: warm near-black navy + gold accents, generous 120px section padding, large rounded
cards, editorial hospitality photography treatment — an **Aman Resorts × Four Seasons** premium
hospitality feel (see `web/CLAUDE.md`'s design decisions). That system is correct for its job:
convincing a prospective guest, owner, or investor that Everloft is a premium brand.

This document governs a **different surface with a different job**: the internal platform staff,
owners, and investors actually *work in* every day — dense data, tables, forms, approval queues.
This brief's own inspiration list makes the split explicit — **Airbnb Host Dashboard** sits
right alongside Stripe/Linear/Notion/Vercel/Attio/Guesty, not next to Airbnb.com's guest-facing
marketing site. Two design systems, one company, exactly like Stripe's own marketing site and
`dashboard.stripe.com` don't share a visual language either.

**What's shared between the two, deliberately, and why:**
- **Typography** — Inter, one family, both surfaces. A platform switching fonts between marketing
  and dashboard reads as two different products; Inter is already excellent for dense UI (that's
  *why* it's the top example in this brief's own font list) and already the site's font.
- **The neutral scale** — background/foreground/border/muted/card tokens (already defined in
  `globals.css`) are already close to Stripe/Linear-appropriate (clean white, slate-gray text,
  near-black primary) — they need refinement (§3), not replacement.
- **Base radius/shadow primitives** — reused at *different* values (§7–8): the marketing site's
  generous, soft rounding is dialed back for the dashboard's denser, more functional feel.

**What's deliberately different, and why:**
- **Gold is retired as the dashboard's primary interactive color.** Gold signals "luxury
  hospitality brand" — correct on the marketing site, wrong on a data-dense finance/ops screen,
  where this brief explicitly asks to avoid "overly colorful interfaces." The dashboard's primary
  action color is a controlled blue (§3) — trustworthy, restrained, exactly the register
  Stripe/Linear/Vercel all use for their primary accent.
- **Tighter radii, smaller shadows, less whitespace per section** (§7–8) — a dashboard optimizes
  for scanning density; a marketing page optimizes for breathing room and emotional pacing. Using
  the marketing site's `rounded-2xl`/`rounded-3xl` cards and 120px section padding on a table-
  dense finance screen would look like a website pretending to be software, not real software.

Every token below is namespaced or scoped so this doesn't require ripping out the marketing
site's tokens — see §5 for exactly how they coexist in one `globals.css`.

---

## 1. Design philosophy

Five words, in priority order when they conflict: **trustworthy → clear → fast → consistent →
premium.** A finance dashboard that's beautiful but ambiguous about whether a number is revenue
or an expense has failed at its actual job. Every rule in this document resolves ties in that
order — e.g., a data table's row density beats decorative whitespace (§11); a status badge's
legibility beats its prettiness (§16).

**Explicitly avoided, per the brief, and why each one fails this platform specifically:**
- *Heavy gradients / glassmorphism* — both reduce text contrast and read as consumer-app trendy,
  not enterprise-trustworthy; they also age visually faster than flat, well-spaced surfaces.
- *Overly colorful interfaces* — a screen with 8 accent colors makes "what does this color mean"
  a constant cognitive tax across a day of real use; this system limits color to semantic meaning
  only (§3, §16).
- *Rounded cartoon UI / Material Design / Bootstrap look* — all three read as either "consumer
  app" or "generic template," undermining the "premium enterprise" goal as directly as a garish
  color palette would.

---

## 2. Visual identity

Modern SaaS, restrained, data-first. Borrowed principles (not pixels) from the brief's own
references: Stripe's numeric precision and calm neutral fields, Linear's tight spacing and subtle
motion, Notion's content-first typography hierarchy, Vercel's high-contrast monochrome-plus-one-
accent discipline, Attio's clean relational tables, Guesty's domain-appropriate density for
property/booking data. Everloft's own identity within that language: the same Inter typeface as
the marketing site (continuity of brand, not a fork), a single blue accent (not gold — see §0),
and slightly warmer neutrals than a pure-gray SaaS template, so the platform still reads as
*Everloft's* software, not white-labeled boilerplate.

---

## 3. Color palette (dashboard-scoped tokens)

### Core neutrals — reused as-is from the live `globals.css` (already correct for this use)
| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `#FFFFFF` | `#0B1220` | page background |
| `foreground` | `#111827` | `#F8FAFC` | primary text |
| `surface` (maps to existing `--card`) | `#FFFFFF` | `#111A2E` | card/panel background |
| `border` | `#E5E7EB` | `#FFFFFF1A` | dividers, card borders, table lines |
| `muted` | `#F8FAFC` | `#1A2440` | subtle backgrounds (table header, hover) |
| `muted-foreground` | `#64748B` | `#94A3B8` | secondary text, captions, table meta |

### New/refined for the dashboard
| Token | Light | Dark | HSL (light) | Use | Why |
|---|---|---|---|---|---|
| `--dash-primary` | `#2563EB` | `#3B82F6` | `221 83% 53%` | primary buttons, active nav item, links, focus ring | Reuses the existing `--blue-accent` value already in `globals.css` — promoted to *the* dashboard primary rather than a secondary accent, replacing gold in this context (§0). |
| `--dash-primary-foreground` | `#FFFFFF` | `#FFFFFF` | — | text/icons on primary buttons | |
| `--dash-secondary` | `#0F172A` | `#F8FAFC` | `222 47% 11%` | secondary buttons, headings | Reuses existing `--primary` — the near-black navy already defined works as a secondary/neutral action color without introducing a new hue. |
| `--dash-success` | `#16A34A` | `#22C55E` | `142 71% 35%` | success badges/toasts, positive revenue deltas | New — no success color exists in the current token set; needed for the Status System (§16). |
| `--dash-success-soft` | `#F0FDF4` | `#14532D33` | — | success badge background | |
| `--dash-warning` | `#D97706` | `#F59E0B` | `32 95% 44%` | warning badges/toasts, pending states | New. Chosen amber, not the brand's `--gold` (`#D4AF37`) — close in hue, easy to confuse with "this is a brand accent" rather than "this needs attention"; a functional amber avoids that ambiguity entirely. |
| `--dash-warning-soft` | `#FFFBEB` | `#78350F33` | — | | |
| `--dash-danger` | `#DC2626` | `#F87171` | `0 74% 51%` | destructive actions, error states | Reuses existing `--destructive` exactly — no new value needed. |
| `--dash-danger-soft` | `#FEF2F2` | `#7F1D1D33` | — | | |
| `--dash-info` | `#0891B2` | `#22D3EE` | `192 91% 36%` | informational banners/badges | New — cyan, distinct enough from primary blue to be scannable as a *different* semantic meaning at a glance. |
| `--dash-info-soft` | `#ECFEFF` | `#164E5E33` | — | | |

**Opacity scale** (applies to any token above via Tailwind's `/` syntax, already how the codebase
uses it — e.g. `bg-gold/25` in `globals.css`'s `::selection` rule): standardize on `/5, /10, /20,
/40, /60, /80` — six steps, matching Tailwind's default opacity utilities, no custom scale needed.

**Gradient usage**: none, by design (§0, §1) — the only place a gradient is acceptable is a chart
fill (§20, e.g. a subtle area-chart gradient fading to transparent), never on a button, card, or
background surface.

**Hover/Focus/Disabled** (states, not standalone colors): `hover` = base color at 90% opacity or
one step darker (component-specific, defined per component in §9); `focus` = 2px `--dash-primary`
ring at `40%` opacity, offset 2px (matches the existing `--ring` token's approach, just scoped to
the new primary); `disabled` = `50%` opacity + `cursor-not-allowed`, applied uniformly rather than
a separate disabled palette per component.

---

## 4. Typography system

**Font pairing decision**: Inter for everything — body and headings both — not a two-font pair.
**Why not a display serif or second family** (even though the brief lists pairing examples):
this platform's headings are almost always short, functional labels ("Revenue Overview," "Booking
#EL-2049") next to dense data, not editorial headlines — a second display face would add a font
load and a visual seam for no legibility or brand benefit here. (The *marketing* site's
`.heading-display` utility already exists and stays on Inter too, for the same continuity reason
noted in §0.)

| Role | Size | Weight | Line height | Letter spacing | Use |
|---|---|---|---|---|---|
| Display | 32px / 2rem | 700 | 1.2 | -0.02em | Page-level report titles (rare) |
| H1 | 28px / 1.75rem | 700 | 1.25 | -0.02em | Dashboard page title |
| H2 | 22px / 1.375rem | 600 | 1.3 | -0.01em | Section heading within a page |
| H3 | 18px / 1.125rem | 600 | 1.35 | -0.01em | Card title |
| H4 | 16px / 1rem | 600 | 1.4 | normal | Sub-card/widget title |
| Title | 15px | 600 | 1.4 | normal | Table column group headers, modal titles |
| Subtitle | 14px | 500 | 1.45 | normal | Secondary heading line under a title |
| Body | 14px | 400 | 1.5 | normal | Default UI text, form labels, table cells |
| Caption | 13px | 400 | 1.4 | normal | Helper text, timestamps, metadata |
| Small | 12px | 500 | 1.35 | 0.01em | Badges, chips, table micro-labels |
| Button | 14px | 500 | 1 | normal | All button labels |
| Table (numeric) | 14px | 400 | 1.5 | normal, **tabular-nums** | Every numeric table column — see below |
| Label | 13px | 500 | 1.4 | 0.01em | Form field labels |

**Why body text is 14px, not 16px**: an enterprise dashboard's default UI density (Stripe, Linear,
Notion all ship 13–14px body text) trades a hair of marketing-site-style comfort for meaningfully
more data visible per screen — the right trade for a "data-first" platform, wrong for a marketing
page (which correctly stays larger).

**`tabular-nums` is a hard rule, not a suggestion**, for every column of numbers in every table
and every metric card (§12, §20) — proportional numeral widths make a column of right-aligned
currency figures visually jitter and genuinely harder to scan; this is one of the highest-value,
lowest-effort things separating "looks like a spreadsheet screenshot" from "looks like Stripe."
Implementation: a `.font-tabular` utility (`font-variant-numeric: tabular-nums`) added once, used
everywhere numbers appear in a column.

---

## 5. Design tokens (how the two systems coexist in one `globals.css`)

The dashboard tokens (§3) are added to the **existing** `@theme inline` block in `globals.css`
under new names (`--dash-*`), not by overwriting `--primary`/`--gold`/etc. — those stay exactly
as they are for the marketing site. A dashboard-scoped Tailwind utility layer maps to them:

```css
/* added to globals.css, alongside the existing :root block — not replacing it */
:root {
  --dash-primary: #2563eb;
  --dash-primary-foreground: #ffffff;
  --dash-success: #16a34a;
  --dash-success-soft: #f0fdf4;
  --dash-warning: #d97706;
  --dash-warning-soft: #fffbeb;
  --dash-danger: #dc2626;         /* == --destructive, referenced not re-declared in practice */
  --dash-danger-soft: #fef2f2;
  --dash-info: #0891b2;
  --dash-info-soft: #ecfeff;
  --dash-radius: 0.5rem;          /* tighter than --radius's 0.85rem, see §7 */
}
.dark {
  --dash-primary: #3b82f6;
  --dash-success: #22c55e;
  --dash-success-soft: #14532d33;
  --dash-warning: #f59e0b;
  --dash-warning-soft: #78350f33;
  --dash-danger-soft: #7f1d1d33;
  --dash-info: #22d3ee;
  --dash-info-soft: #164e5e33;
}
```

**Token categories, all following this same "additive, `--dash-` prefixed where the value
actually differs from the marketing site's" rule**: Colors (above), Spacing (§6, no new tokens
needed — Tailwind's default 4px scale is reused directly), Radius (§7, new `--dash-radius`),
Typography (§4, new size/weight utilities), Shadows (§8, new `--dash-shadow-*`), Icons (§9, sizing
convention not a token), Animation (§14, Framer Motion variants, not CSS tokens).

---

## 6. Spacing system

**4px base grid** — Tailwind's default scale (`1` = 4px, `2` = 8px, `3` = 12px, `4` = 16px, `6` =
24px, `8` = 32px, `12` = 48px, `16` = 64px) is used directly, not redefined — it already *is* a
4px grid, and the codebase already uses it throughout. Formalized here as a rule, not a new token
set: **never use an arbitrary pixel value** (`p-[13px]`) in dashboard UI; always the nearest scale
step.

| Context | Value | Rationale |
|---|---|---|
| Input/button internal padding | `px-3 py-2` (12px/8px) | dense but comfortably tappable |
| Card padding | `p-6` (24px) | matches Stripe/Linear card density |
| Card-to-card gap in a grid | `gap-4` to `gap-6` (16–24px) | tighter than the marketing site's `gap-6`–`gap-14` |
| Page margin (dashboard content area) | `p-6` to `p-8` (24–32px) | vs. the marketing site's 64–120px section padding — deliberately far tighter, per §0 |
| Table cell padding | `px-4 py-3` (16px/12px) | dense enough for scanning many rows, not cramped |
| Section-to-section spacing within a dashboard page | `space-y-6` to `space-y-8` | |

**Responsive breakpoints** — Tailwind defaults, unchanged: `sm 640px, md 768px, lg 1024px, xl
1280px, 2xl 1536px`. Dashboard layout breakpoint behavior (§17): sidebar collapses to icon-only
at `lg`, to an off-canvas sheet at `md` and below (reusing the existing `Sheet` component already
used for the marketing nav's mobile menu).

---

## 7. Border radius

| Element | Token | Value | vs. marketing site |
|---|---|---|---|
| Buttons, inputs, badges, chips | `--dash-radius` | `0.5rem` (8px) | marketing buttons use `rounded-full`/`rounded-xl` — the dashboard is deliberately tighter, per §0 |
| Cards, panels, modals | `--dash-radius` × 1.5 | `0.75rem` (12px) | vs. marketing's `rounded-2xl`/`rounded-3xl` |
| Tables (outer container only, never individual cells) | same as cards | `0.75rem` | |
| Avatars | full circle | `9999px` | unchanged, avatars are always circular in both systems |
| Images/thumbnails (property photo in a table row, document preview) | `0.5rem` | | |

**Why tighter radii read as "more serious software"**: large, soft rounding (the marketing site's
correct choice, evoking a warm hospitality brand) reads as friendly/consumer; enterprise tools
that handle money and legal documents (Stripe, Linear) consistently use smaller radii — it's a
small, well-established, if easy-to-miss, disambiguating signal to their users' brains.

---

## 8. Shadow system (new — no formal scale exists in the codebase yet)

| Token | Value | Use |
|---|---|---|
| `--dash-shadow-sm` | `0 1px 2px rgb(0 0 0 / 0.05)` | resting card, table row hover |
| `--dash-shadow-md` | `0 4px 8px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04)` | raised card, dropdown trigger |
| `--dash-shadow-lg` | `0 12px 24px rgb(0 0 0 / 0.08)` | popovers, dropdown menus |
| `--dash-shadow-floating` | `0 20px 40px rgb(0 0 0 / 0.12)` | floating action button, toasts |
| `--dash-shadow-modal` | `0 24px 48px rgb(0 0 0 / 0.18)` | dialogs, side drawers |

**Why deliberately subtle at every level** (no shadow exceeds ~0.18 opacity even at "modal"):
heavy drop shadows read as skeuomorphic/dated in 2026-era enterprise software; every reference in
the brief's inspiration list (Stripe, Linear, Vercel) uses shadows this restrained. Dark mode
uses the same values — a shadow's job (implying elevation via a barely-there edge) works
identically on a dark surface; it doesn't need inverting or lightening.

---

## 9. Iconography

**Lucide, exclusively** (already the codebase's icon set). Rules:
| Context | Size | Stroke width |
|---|---|---|
| Inline with body text, table cells | 16px | 1.75 (Lucide default) |
| Buttons, nav items | 18–20px | 1.75 |
| Section/card headers, empty states | 24px | 1.5 (slightly lighter at larger sizes reads less heavy) |
| Empty-state hero icon | 48px | 1.25 |

**Color**: icons inherit `currentColor` by default (never a hardcoded hex) so they automatically
track their container's state (a disabled button's icon dims with its text, a danger button's
icon is white without a separate override) — this is already how Lucide's React components work
by default; the rule is simply *never override it with an explicit fill/stroke color* except for
semantic status icons (success/warning/danger/info, using their matching §3 token).

---

## 10. Button system

| Variant | Background | Text | Use |
|---|---|---|---|
| Primary | `--dash-primary` | white | main call-to-action per screen (Save, Create Property) |
| Secondary | `--dash-secondary` (near-black) | white | secondary-but-still-emphasized actions |
| Outline | transparent, `border` token | `foreground` | tertiary actions, filter toggles |
| Ghost | transparent | `foreground` | icon-adjacent, toolbar actions |
| Destructive | `--dash-danger` | white | delete, cancel booking, revoke access |
| Success | `--dash-success` | white | approve, confirm — used sparingly, only for genuine confirm-style actions |
| Link | transparent | `--dash-primary`, underline on hover | inline text-level actions |
| Icon button | ghost background, square, `p-2` | — | table row actions, toolbar |
| Loading | same as base variant, spinner replaces leading icon, text stays | — | any async action, `disabled` during load |
| Split button | primary + a `ChevronDown`-triggered dropdown of related actions, divided by a 1px border | — | "Save" + "Save and create another" |
| Dropdown button | button whose click opens a menu instead of firing an action directly | — | "Export ▾" (CSV/PDF/Excel) |
| Floating action button | circular, `--dash-shadow-floating`, primary color, bottom-right | — | rare — only for a single, dominant create action on a list page |

**States, defined once, applying to every variant above** (not repeated per row): `hover` = 6–8%
darker/lighter depending on light/dark mode; `focus` = 2px ring in the button's own color at 40%
opacity, offset 2px; `active` (pressed) = additional 4% darken, no scale transform (scale-on-press
reads as a mobile-app affordance, not desktop-software); `disabled` = 50% opacity, no hover/active
response, `cursor-not-allowed`; `loading` = as above, additionally not clickable regardless of
opacity.

---

## 11. Form system

Every input shares one visual shell: `--dash-radius` (§7), 1px `border` token, `--dash-shadow-sm`
only on focus (not at rest — a resting form shouldn't look "raised"), focus ring per §3.

| Field | Notes |
|---|---|
| Text / Email / Phone | Standard `Input` (already built at `components/ui/input.tsx`) — Phone adds a country-code prefix select, Email adds `type="email"` for native validation assist |
| Password | `Input` + trailing visibility-toggle icon button (eye/eye-off) |
| Textarea | `components/ui/textarea.tsx` (exists) — auto-grow up to a max of ~8 rows, then scrolls |
| Number / Currency | Right-aligned, `tabular-nums` (§4); Currency additionally shows the currency code/symbol as a fixed prefix inside the field, never editable inline with the number |
| Date Picker / Time Picker | `components/ui/calendar.tsx` (exists, react-day-picker) in a Popover; Time Picker is a new, simple 15-minute-increment `Select` (no need for a full custom time-wheel component at this scale) |
| Search | `Input` with a leading `Search` icon, `⌘K`-style keyboard shortcut hint on desktop for the global search specifically (not every inline search box) |
| Select / Multi Select | `components/ui/select.tsx` (exists) for single; Multi Select is a new composite — the same trigger shell, showing selected items as removable chips inside the trigger once 1+ selected |
| Autocomplete | Select + async-filtered options + a loading-spinner state in the dropdown while fetching |
| Checkbox / Radio | `components/ui/checkbox.tsx`, `radio-group.tsx` (both exist) |
| Toggle / Switch | New — a single `Switch` component (not yet in the 14 installed shadcn components); on-state uses `--dash-primary` |
| Slider | `components/ui/slider.tsx` (exists) — already used for the property-management revenue calculator |
| Upload | Drag-and-drop zone, dashed `border` at rest, solid `--dash-primary` border + `--dash-info-soft` background on drag-over; see §21 for full spec |
| OTP Input | New — 6 individual 1-character boxes, auto-advance focus, needed once 2FA (per `docs/AUTH_RBAC_ARCHITECTURE.md`) is enabled |

**Validation, one consistent pattern for every field type above**: a required field gets a small
`--dash-danger` asterisk directly after its label (never color-only — always the literal `*`
glyph, for accessibility, §15). Helper text sits directly below the field in `muted-foreground`,
replaced (not appended) by error text in `--dash-danger` the moment a field is invalid — never
both shown at once. A valid-after-being-invalid field gets a brief `--dash-success` border flash
(Framer Motion, ~200ms) then returns to the resting border color — success state is a transient
confirmation, not a permanent green box (a permanently green input reads as "this field is
special," which it isn't).

---

## 12. Table system (enterprise-grade, the highest-stakes component in this whole system)

Built on `components/ui/table.tsx` (exists) + TanStack Table (per `docs/ARCHITECTURE.md`, not yet
installed) as `components/shared/DataTable` — one shared implementation, every feature's list view
uses it, per the "built once" rule in `docs/ARCHITECTURE.md` §5.

| Capability | Spec |
|---|---|
| Sorting | click column header, `ArrowUp`/`ArrowDown` icon appears only on the active sorted column (not shown, faded, on every column at rest — reduces header noise) |
| Filtering | a filter bar above the table, not inline per-column filter rows (inline filter rows push every row down and rarely get used per-column in practice) |
| Searching | single search input in the toolbar, debounced 300ms |
| Pagination | bottom-right, page-size selector bottom-left, "Showing 1–20 of 4,281" label between them — **never client-side pagination past a few hundred rows** (per `docs/ARCHITECTURE.md` §14 scalability rule) |
| Column visibility | a "Columns" dropdown button (checkbox list), state persisted per-user (future: in a `user_preferences` row, not built yet) |
| Sticky header | always, on any table taller than the viewport |
| Bulk selection | leading checkbox column, header checkbox = select-all-on-page, a "select all 4,281 matching" text link appears once the page is fully selected (Linear/Gmail pattern) — selecting *across* pages without this affordance is a common enterprise-table trap users don't expect |
| Expandable rows | leading chevron toggle, expanded content indented under a thin left border matching the row's status color if applicable |
| Row actions | trailing icon-button (`MoreHorizontal`) opening a dropdown — never more than 1 always-visible action button per row before that, to keep rows visually calm |
| Status chips | see §16 — always the same badge component, never a bespoke colored `<span>` per table |
| Responsive | below `md`, the table becomes a stacked card list (one card per row, label:value pairs) rather than a horizontally-scrolling table — horizontal-scroll tables are usable on desktop trackpads, painful on touch |

---

## 13. Card system

One base `Card` primitive (`components/ui/card.tsx`, exists), specialized by content, not by a
different component per card type:

| Card | Layout |
|---|---|
| Metric/Stat Card | eyebrow label (caption, `muted-foreground`) → large tabular-nums value (H2 size) → small delta indicator (↑/↓ + percent, colored `--dash-success`/`--dash-danger`) |
| Property / Booking / Owner / Investor Card | thumbnail or avatar (left or top) + title/H3 + 2–3 key:value lines + a trailing status chip |
| Revenue / Expense Card | Metric Card shape + an inline sparkline (last 7/30 days) instead of a delta arrow alone |
| Chart Card | H3 title + optional filter control (date-range select) in the header row + the chart itself, `p-6`, no internal chart border (the card's own border is sufficient — nesting another border/background around the chart reads as a "box within a box") |

All cards: `--dash-shadow-sm` at rest, `--dash-shadow-md` on hover *only if the card is
clickable/navigable* (a purely informational metric card should not lift on hover — that
motion implies interactivity that isn't there).

---

## 14. Modal system

| Type | Component | Notes |
|---|---|---|
| Dialog | `components/ui/dialog.tsx` (exists) | standard centered modal, forms, detail edit |
| Confirmation | Dialog, smaller max-width (`max-w-sm`), no form fields, two buttons only | |
| Delete Confirmation | Confirmation + `--dash-danger` "Delete" button + the item's name restated in the body ("Delete **Ocean View Villa**? This cannot be undone.") — restating the name specifically prevents the well-known "clicked delete on the wrong row" mistake | |
| Image Viewer | Fullscreen overlay, `bg-black/90`, arrow-key navigation between a set, close on `Escape`/backdrop click | |
| Document Preview | Side drawer (not a centered dialog) for PDFs/agreements — a document benefits from a taller, narrower viewport than a centered modal provides | |
| Fullscreen Modal | reserved for genuinely complex multi-step flows (e.g. a full booking-creation wizard) — not the default for anything simpler | |
| Side Drawer | `components/ui/sheet.tsx` (exists, already used for the mobile nav) — reused here for row-detail "quick view" panels | |
| Bottom Sheet | mobile-only variant of the Side Drawer (slides from bottom instead of the side) at `<md` |

All modals/drawers: `--dash-shadow-modal` (§8), `--dash-radius` × 1.5 corners (dialogs only —
side drawers/bottom sheets are flush against their edge, no rounding on the attached side).

---

## 15. Navigation

- **Sidebar**: fixed-width (`w-64`), `background` = `surface` (card token), items grouped by the
  `config/navigation.ts` structure (per `docs/ARCHITECTURE.md`), active item = `--dash-primary`
  text + a `--dash-primary`-tinted background at `10%` opacity + a 2px left accent bar — not a
  filled pill (a filled active-pill on every nav item across 15+ items reads visually loud;
  Linear's subtle left-bar-plus-tint treatment is calmer at this item count).
- **Collapsed sidebar**: icon-only, `w-16`, labels appear in a `Tooltip` on hover — not a
  secondary flyout menu (adds a click, unnecessary for single-level nav items).
- **Top navigation**: only used for the marketing site (already built, `Navbar`) — the dashboard
  uses sidebar + a slim top bar (search, notifications bell, profile menu) instead of a full top
  nav bar, standard enterprise-dashboard convention.
- **Breadcrumb**: `components/ui/breadcrumb.tsx` (exists) — shown on any page nested more than one
  level deep (e.g. Properties → Ocean View Villa → Edit).
- **Tabs / Vertical Tabs**: `components/ui/tabs.tsx` (exists) for horizontal in-page section
  switching (e.g. a property's Overview/Photos/Documents/Bookings tabs); vertical tabs reserved
  for Settings-style pages with many sections, where a left-hand list scales better than a
  horizontal scroller.
- **Mega menu**: not needed — the dashboard's information architecture (per `docs/
  ARCHITECTURE.md`'s routing table) is flat enough that a standard sidebar covers it; a mega menu
  solves a breadth-of-navigation problem this platform doesn't have.
- **Profile menu / Notification menu**: `components/ui/dropdown-menu.tsx` (exists) — profile menu
  in the top-right (avatar trigger), notification bell with an unread-count badge (§16) opening a
  panel of recent `notifications` rows (already a live table).

---

## 16. Status system (standardized badges)

One `StatusChip`/`Badge` component (a `--dash-radius` pill, `px-2.5 py-0.5`, Small typography,
§4), colored **only** from the semantic palette in §3 — never a bespoke color per status string.
Mapping (extendable — new statuses map to the nearest semantic meaning, never invent a new color):

| Semantic | Color | Example statuses |
|---|---|---|
| Neutral | `muted` background, `foreground` text | Draft, Archived, Available |
| Info | `--dash-info-soft` bg, `--dash-info` text | Pending, Booked (informational, not yet actionable) |
| Success | `--dash-success-soft` bg, `--dash-success` text | Active, Approved, Completed |
| Warning | `--dash-warning-soft` bg, `--dash-warning` text | Maintenance, Cleaning, Awaiting Approval |
| Danger | `--dash-danger-soft` bg, `--dash-danger` text | Inactive, Rejected, Cancelled, Blocked |

**Why five semantic buckets, not a unique color per status word**: the brief lists ~13 example
statuses (Active, Inactive, Draft, Archived, Pending, Approved, Rejected, Cancelled, Completed,
Maintenance, Cleaning, Booked, Available) — mapping each to its own hue would mean 13 colors a
user has to memorize the meaning of. Mapping them to 5 semantic buckets means a user only ever
has to learn "green = good/done, amber = needs attention, red = stopped/bad, blue = informational,
gray = inactive-but-not-alarming" once, and it transfers correctly to every future status this
platform ever adds.

---

## 17. Feedback system

| Component | Spec |
|---|---|
| Toast | `components/ui/sonner.tsx` (exists, already wired) — top-right, auto-dismiss 4s (errors: 6s / manual dismiss only), one visible at a time preferred (queue, don't stack more than 3) |
| Snackbar | not used separately from Toast — one unified transient-message component, not two overlapping patterns |
| Alert | inline, persistent (not auto-dismissing), used within a page/form for a standing warning ("This property has an unpaid utility bill") — semantic color per §16 |
| Banner | full-width, top-of-page, for platform-wide notices (maintenance window, trial expiring) — the only feedback element allowed to span full width |
| Empty State | icon (§9, 48px) + H4 message + one primary action button ("No properties yet" → "Add your first property") — never just a blank table |
| Skeleton Loading | `components/ui/skeleton.tsx` (exists) — matches the shape of the content it's replacing (a table skeleton has row-shaped bars, a card skeleton has card-shaped blocks), never a single generic spinner for a whole page |
| Spinner | reserved for small, in-component loading (a button's loading state, §10) — not full-page loading, which uses Skeleton instead |
| Progress Bar | determinate (file upload, §21) vs. indeterminate (unknown-duration background job) — visually distinct (indeterminate uses a moving gradient sweep, determinate a filled bar) |
| Success Screen / Error Screen | full-page variants of Empty State's pattern, reserved for terminal states of a flow (e.g. after a multi-step booking creation completes) |

---

## 18. File upload (spec)

Drag-and-drop zone (dashed `border`, `--dash-radius` × 1.5) → on drop: image files show an
inline thumbnail preview grid (reusing the same thumbnail radius as §7), non-image files show a
file-type icon + filename + size instead. Each file gets its own progress bar (§17) inline under
its thumbnail/icon during upload, replaced by a delete (`X`) icon-button once complete.
Multiple files upload in parallel (not sequential — no reason to block file 2 behind file 1 for
independent R2 objects). Reordering: drag-handle on each thumbnail, relevant specifically for
property photo galleries where display order matters (not needed for e.g. document uploads).

---

## 19. Responsive design

Mobile-first Tailwind usage (`base → sm → md → lg → xl`), consistent with the marketing site's
existing approach. Dashboard-specific behavior:
- **Desktop/laptop (`lg`+)**: full sidebar, multi-column card grids, full tables.
- **Tablet (`md`)**: sidebar collapses to icon-only (§15); card grids drop to 2 columns; tables
  still render as tables (enough width remains at 768px+ for the core columns).
- **Mobile (`<md`)**: sidebar becomes an off-canvas `Sheet` (already the pattern used for the
  marketing nav); card grids single-column; tables become stacked cards (§12).
- **Large screens (`2xl`+, e.g. ultra-wide monitors)**: content area gets a `max-w-[1600px]` cap,
  not full-bleed — an unconstrained table/dashboard on a 34" monitor produces uncomfortably long
  eye-travel per row, the same reasoning that already caps the marketing site at 1440px.

---

## 20. Charts

Recharts (already installed and in use — `PortfolioGrowthChart`, `PortfolioMixChart`,
`PropertyRevenueChart`). Standardized per chart purpose:

| Chart | Type | Color mapping |
|---|---|---|
| Revenue | Area chart, subtle gradient fill fading to transparent (the one approved gradient use, §3) | `--dash-primary` |
| Expenses | Bar chart | `--dash-danger` at reduced opacity (60%) — expenses shouldn't visually alarm at a glance, just read as distinct from revenue |
| Occupancy | Line chart, 0–100% y-axis | `--dash-info` |
| ROI / Portfolio performance | Line chart, can go negative — a zero-baseline reference line is mandatory | `--dash-success` above zero, `--dash-danger` below, one line with a color-changing segment rather than two overlapping lines |
| Bookings (volume over time) | Bar chart | `--dash-secondary` |
| Property performance (comparison) | Horizontal bar chart, sorted descending | `--dash-primary` |
| Investor portfolio mix | Donut/pie chart, max 6 slices before grouping the rest into "Other" | the `chart-1..5` tokens already defined in `globals.css`, reused as-is — no new categorical palette needed |

**Every chart, without exception**: `tabular-nums` axis labels (§4), tooltips using the `Card`
shadow/radius (§8/§7, not a separate ad hoc tooltip style), and a visible "no data yet" empty
state (§17) rather than an empty axes grid when a property/period genuinely has no data.

---

## 21. Component library — naming conventions

Matches `docs/ARCHITECTURE.md` §12 exactly (this document doesn't introduce a second naming
scheme): component files `kebab-case.tsx`, components `PascalCase`, one component per file.
Dashboard-specific components live in `components/shared/` (cross-feature, per `docs/
ARCHITECTURE.md` §5) prefixed with nothing special — `DataTable`, `MetricCard`, `StatusChip`,
`EmptyState`, `PasswordStrengthMeter` (per `docs/AUTH_RBAC_ARCHITECTURE.md` §13) — a feature-
specific variant (e.g. a `PropertyCard`) lives in that feature's own `components/` instead.

---

## 22. Accessibility standards

- **WCAG AA minimum**: every color pairing in §3 checked against its background at 4.5:1 for body
  text, 3:1 for large text/icons — the `muted-foreground` value (`#64748B` on white) is already
  right at the edge of AA for small text; **use it only for text 14px+ or pair with `foreground`
  for anything smaller**, called out explicitly since it's the one token in this system closest
  to failing.
- **Keyboard navigation**: every interactive element reachable via `Tab`, every dropdown/menu
  operable via arrow keys + `Enter`/`Escape` — this comes largely free from using Radix primitives
  (shadcn's base, already the codebase's foundation) correctly; the rule is *never* replace a
  Radix-based interactive component with a plain `<div onClick>`.
- **Focus indicators**: always visible, never `outline: none` without a replacement — the `--ring`
  token (existing) / `--dash-primary` ring (§3) is the one and only focus style across the whole
  platform, never a component-specific alternative.
- **Screen reader support**: every icon-only button gets an `aria-label`; every status chip's
  color-coded meaning (§16) also has the literal text label present (never color-only meaning);
  every form error is associated to its field via `aria-describedby` (a pattern already available
  via shadcn's `Label`/`Input` pairing, needs to be used consistently, not introduced).
- **ARIA labels**: data tables get `aria-sort` on sorted columns; loading states get
  `aria-live="polite"` regions so a screen reader announces "Loading properties..." → "24
  properties loaded" without the user needing to poll.

---

## 23. Motion guidelines (Framer Motion — already installed, used via `components/motion/reveal.tsx`)

**Subtle, functional, never decorative-for-its-own-sake** — directly per the brief. Concrete
rules, replacing "use your judgment" with actual numbers:
| Motion | Duration | Easing | Use |
|---|---|---|---|
| Fade | 150ms | ease-out | toast enter, tooltip/popover open |
| Slide (drawer/sheet) | 250ms | ease-out (in), ease-in (out) | side drawer, bottom sheet |
| Scale | 100ms, 0.98→1 | ease-out | dropdown menu open (a *subtle* scale, not the marketing site's more expressive hero-section scale-ins) |
| Page transition | none by default | — | dashboard page navigations are instant, not animated — animating every route change in a data tool adds perceived latency for no benefit; reserved only for genuine step-based flows (a wizard's step 1→2) |
| Hover | 100ms | ease | button/card background color, shadow elevation |
| Loading | continuous, linear | — | spinner rotation, indeterminate progress sweep |

**The marketing site's `Reveal`/`RevealGroup` scroll-triggered animations (§ existing) are NOT
reused in the dashboard** — a scroll-reveal fade-in on every dashboard card, seen dozens of times
a day by the same staff user, goes from "elegant" to "why is this always fading in" within a
week of daily use. Motion in the dashboard is reserved for *state changes* (something opened,
loaded, succeeded), never for *scroll position*.

---

## 24. Dark mode

CSS variables for dark mode **already exist** in `globals.css`'s `.dark` class (background,
card, border, all of it, including the `--dash-*` tokens defined in §5) — what's **missing** is
the actual toggle: `next-themes` is installed (its `useTheme` hook is already imported by
`components/ui/sonner.tsx`) but **no `ThemeProvider` wraps the app yet**, so dark mode CSS exists
but nothing currently switches the `.dark` class. Enabling it is two small additions once this
system is actually implemented (not done in this document, per its "design system, not
implementation" scope): a `ThemeProvider` in `providers/` (per `docs/ARCHITECTURE.md`'s
`providers/` folder) wrapping `app/layout.tsx`, and a theme-toggle control in the profile menu
(§15) or Security Settings-adjacent Preferences screen (per `docs/AUTH_RBAC_ARCHITECTURE.md`'s
`preferred_theme` profile column, which already exists as a design decision waiting for this UI).
Every token in §3/§7/§8 already has its dark-mode value specified above — no further design work
is needed to flip this on, only the provider wiring.

---

## 25. Figma-ready component specifications (summary reference)

For a designer building this in Figma directly from this document: every component above
resolves to a token from §3–§9 plus the states in §10 (hover/focus/active/disabled/loading) —
build each as a Figma component with those five state variants from the start, using the color
styles named exactly as the `--dash-*` tokens (`dash/primary`, `dash/success`, etc.) so a design
token sync (Figma Tokens plugin or similar) maps 1:1 back to `globals.css` without manual
re-mapping. Component variant naming in Figma should mirror §21's naming convention
(`Button/Primary/Default`, `Button/Primary/Hover`, ...) rather than a separate Figma-only naming
scheme, so a developer reading a Figma link and a developer reading this document are never
looking at two different vocabularies for the same thing.

---

## Appendix: what's genuinely new vs. already real, at a glance

✅ **Already live, reused as-is**: Inter font, the neutral color scale, `--blue-accent` (now also
`--dash-primary`), dark-mode CSS values, 14 shadcn components (`accordion, avatar, badge,
breadcrumb, button, calendar, card, checkbox, dialog, dropdown-menu, input, label, pagination,
popover, radio-group, select, separator, sheet, skeleton, slider, sonner, table, tabs, textarea,
tooltip`), Framer Motion, Lucide, Recharts, the `4px`/Tailwind-default spacing scale.

🔲 **New, designed in this document, not yet built**: the `--dash-*` semantic status colors
(success/warning/info didn't exist before), the tighter dashboard-scoped radius/shadow scale, the
`Switch`/Multi-Select/OTP Input components, the shared `DataTable`/`MetricCard`/`StatusChip`
components, `ThemeProvider` wiring for the dark mode toggle, and every dashboard-specific layout
rule in §15/§19 (the actual dashboard shell doesn't exist yet — see `docs/ARCHITECTURE.md` §6 for
its planned structure, this document specifies its visual language for whenever it's built).
