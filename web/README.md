# Everloft — Hospitality Asset Management Platform

Next.js foundation for Everloft's PMS/Owner Portal/Investor Portal/Operations
Dashboard. This README covers the **foundation layer only** (auth, RBAC,
database, storage, basic dashboard) — booking, revenue, and OTA modules are
built on top of this later.

## Stack

| Layer          | Choice                                              |
| -------------- | ---------------------------------------------------- |
| Frontend       | Next.js 16 (App Router), TypeScript, Tailwind v4, shadcn/ui |
| Forms          | React Hook Form + Zod                                 |
| Data fetching  | TanStack Query, TanStack Table (installed as needed per feature) |
| Motion         | Framer Motion                                         |
| Backend/DB     | Supabase (Postgres + Auth)                            |
| Storage        | Cloudflare R2 (S3-compatible API)                     |
| Hosting/CDN    | Vercel + Cloudflare                                   |

There is a **second, older data layer** still in this codebase: Prisma +
SQLite, backing the public marketing site's property listings/reviews/leads.
That's intentional for now — see `CLAUDE.md` → "Two databases, on purpose
(for now)" before touching either.

---

## ⚡ Quick Reference

### Running the App
```bash
# Inside web/ directory:
npm.cmd run dev   # (Windows / PowerShell)
# or: npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**.

### Navigation & Key URLs
| Destination | URL | Description |
|---|---|---|
| **Public Site** | `/` | Marketing landing page |
| **Login** | `/login` | Email/password sign in |
| **Platform Overview** | `/dashboard` | System status, user counts, DB metrics (Super Admin / Tech Admin) |
| **Super Admin Workspace** | `/dashboard/super-admin` | Full operational console, KPIs, charts, managing properties |
| **Properties List** | `/dashboard/properties` | Portfolio table with status, search, and edit links |
| **Add New Property** | `/dashboard/properties/new` | Multi-step property onboarding wizard |
| **Password Reset** | `/forgot-password` | Self-service password recovery flow |

### Seeded Test Accounts (Supabase Auth)
| Role | Email / Username | Password |
|---|---|---|
| **Super Admin** | `superadmin@everloft.co.in` | `Ever@123` |
| **Operations Manager** | `opsadmin@everloft.co.in` | *(same / reset)* |
| **Property Owner** | `owner01@everloft.co.in` | *(same / reset)* |
| **Investor** | `investor01@everloft.co.in` | *(same / reset)* |
| **Housekeeping** | `housekeep01@everloft.co.in` | *(same / reset)* |
| **Maintenance** | `maint01@everloft.co.in` | *(same / reset)* |
| **Guest** | `guest01@everloft.co.in` | *(same / reset)* |

---


## First-time setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Install the Supabase CLI and link it:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   ```
3. Apply this repo's schema:
   ```bash
   npx supabase db push
   ```
   This runs every file in `supabase/migrations/` in order: extensions,
   RBAC tables, profiles, user_roles, activity/audit logs, notifications,
   files, the properties foundation table, RLS policies, then seeds the 11
   default roles and the permission catalogue.
4. Copy `.env.example` to `.env` and fill in the real values from
   **Supabase → Settings → API** (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
5. Regenerate typed DB bindings once the project is linked (optional but
   recommended — replaces the hand-written `src/lib/supabase/types.ts`):
   ```bash
   npx supabase gen types typescript --linked > src/lib/supabase/types.ts
   ```

### 3. Create your first user

Self-signup is intentionally disabled (`enable_signup = false` in
`supabase/config.toml`) — accounts are admin-provisioned, matching how a PMS
platform actually onboards staff/owners/investors. To create the first
Super Admin:

1. In the Supabase dashboard: **Authentication → Users → Add user**, set an
   email + password.
2. In **Table Editor → user_roles**, insert a row linking that user's `id`
   to the `super_admin` role's `id` from the `roles` table, with
   `is_primary = true`.
3. Sign in at `/login` — you'll land on the platform overview dashboard.

### 4. Configure Cloudflare R2 (optional until file uploads are needed)

1. Cloudflare dashboard → R2 → create the 11 buckets listed in
   `src/lib/storage/r2.ts` (`property-images`, `property-videos`,
   `agreements`, `documents`, `owner-documents`, `investor-documents`,
   `guest-ids`, `maintenance`, `invoices`, `receipts`, `review-images`).
2. R2 → Manage API Tokens → create a token with read/write access to those
   buckets.
3. Fill in `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` in
   `.env`. Set `R2_PUBLIC_BASE_URL` once you attach a public-access domain
   to a bucket (only needed for buckets meant to be publicly viewable, e.g.
   `property-images`).

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's in the foundation

- **Auth**: Supabase Auth (email/password now; Google OAuth and magic link
  are configured-but-disabled in `supabase/config.toml`, ready to flip on).
  Session cookies are refreshed on every request by `src/proxy.ts`.
- **RBAC**: `roles` / `permissions` / `role_permissions` / `user_roles`
  tables — see `supabase/migrations/20260730000008_seed_rbac_data.sql` for
  the 11 seeded roles and their default grants. Nothing is hardcoded in
  application code; adding a "Future Custom Role" is a DB insert, not a
  deploy.
- **Row Level Security**: enabled on every table
  (`supabase/migrations/20260730000007_rls_policies.sql`), backed by two
  reusable Postgres functions, `authorize(permission_key)` and
  `has_role(role_slug)`.
- **Audit trail**: `activity_logs` (human-readable feed) and `audit_logs`
  (mechanical before/after diff via a generic trigger,
  `record_audit_log()`) are both populated automatically — no per-feature
  logging code required.
- **Storage**: `src/lib/storage/r2.ts` wraps Cloudflare R2 with size limits
  (20MB images / 500MB video), automatic WebP conversion + compression for
  image buckets, and signed-URL generation for private buckets.
- **Dashboard**: `/dashboard` shows a basic platform overview (Super
  Admin/Tech Admin) — property/user/owner/investor counts, recent activity,
  latest logins, system status — with occupancy/revenue explicitly as
  placeholders until those modules exist. Every other role lands on its
  existing (legacy-ported) analytics workspace at `/dashboard/{role-slug}`.

## Folder structure

Existing code follows a component-type layout (`components/dashboard`,
`components/site`, `lib/dashboard`). New foundation code added in this pass
follows a clearer domain split under `lib/` (`lib/supabase`, `lib/rbac`,
`lib/storage`) rather than a full physical reorg into `/features/*` — see
`CLAUDE.md` → "Folder structure direction" for the reasoning and the target
shape for new feature work going forward.
