# Vercel Performance & Workflow Architecture Guide
**Everloft Commercial Accommodation Management Platform**
*Branch: `perf/vercel-fluid-cpu-hardening`*

---

## 1. Local Setup Guide

### Prerequisites & Runtime
- **Node.js**: v20+
- **Package Manager**: `npm` (run commands inside the `web/` directory using `npm.cmd` on Windows)
- **Framework**: Next.js 16.2.12 (Turbopack) with React 19

### Installation & Local Commands
```bash
# 1. Change directory to web/
cd web

# 2. Install dependencies cleanly
npm install

# 3. Generate Prisma client & start development server
npm run dev

# 4. Run full test suite (Vitest)
npm test

# 5. Execute TypeScript type checking
npx tsc --noEmit

# 6. Test production build locally
npm run build
```

---

## 2. Environment Variables & Scope Configuration

### Environment Variable Scopes
| Variable Name | Scope | Purpose & Safety Rule |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client + Server) | Supabase project endpoint URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client + Server) | Anonymous Supabase key (bound by RLS). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Production/Staging Server ONLY** | Sensitive admin key. **NEVER** expose to browser. |
| `VERCEL_ENV` | Vercel System | Set automatically by Vercel (`production`, `preview`, `development`). |
| `DISABLE_BACKGROUND_JOBS` | Staging / Preview / Test | Set to `"true"` to disable all background sync jobs. |

### Local Environment Setup (`.env.example`)
Create `.env.local` inside `web/` by copying `.env.example`. **Never commit secret keys to Git.**

---

## 3. Local Async-Job Testing

- Routine testing must run locally against synthetic test fixtures.
- iCal parsing unit tests run without live network requests using sample iCalendar strings.
- Google Sheets & property import actions use bounded batch limits (max 50 records per invocation).
- To manually disable all background crons and sync jobs during local testing, set `DISABLE_BACKGROUND_JOBS=true`.

---

## 4. Staging & Preview Deployment Workflow

- **Branch Protection**: All development occurs on feature branches (e.g. `perf/vercel-fluid-cpu-hardening`).
- **Preview Deployments**: Pushing feature branches to GitHub generates Vercel Preview deployments.
- **Safety Controls**:
  - Preview deployments utilize Staging Supabase database credentials.
  - Background crons, scheduled iCal syncs, and live external webhooks are **automatically disabled** in Preview deployments via `env-guard.ts` (`isBackgroundJobAllowed()`).
  - Production customer data is never accessed or mutated from Preview deployments.

---

## 5. Production Release Checklist

Before merging feature branches into `main`:
1. [ ] **Type Check**: `npx tsc --noEmit` passes with 0 errors.
2. [ ] **Test Suite**: `npm test` passes 100% of unit & integration tests.
3. [ ] **Production Build**: `npm run build` succeeds locally without warnings or un-handled promise rejections.
4. [ ] **Environment Guard**: Confirm no floating background promises or un-awaited sync calls remain in Server Actions or API routes.
5. [ ] **Database Migrations**: Any database migrations have been reviewed, formatted, and staged safely.
6. [ ] **Secrets Verification**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is restricted to Server-side runtime context.

---

## 6. Rollback Procedure

### Instant Vercel Rollback
1. Log into the **Vercel Dashboard** -> Everloft Project.
2. Navigate to the **Deployments** tab.
3. Select the previous stable Production deployment.
4. Click **Instant Rollback** to restore production traffic instantly without rebuilding code.

### Database Rollback
- If a database migration was applied, execute the corresponding rollback SQL script prepared in `supabase/migrations/`.

---

## 7. Synchronization Job Architecture

All background synchronization jobs (iCal, Google Sheets, Property Importers) strictly enforce 5 core principles:

1. **Idempotency**: Every sync operation uses stable identifiers (`reservation_code`, external UID) to prevent duplicate records on repeated execution.
2. **Bounded Execution**: External HTTP requests utilize `AbortController` timeouts (maximum 10 seconds). Batch sizes are capped at 50 items per request.
3. **Resumability**: Job progress is tracked via checkpoints (`last_synced_at`), allowing interrupted executions to resume seamlessly.
4. **No Floating Promises**: All async operations are explicitly `await`ed before returning HTTP responses, preventing Vercel Serverless Function execution leakage.
5. **Preview Isolation**: `isBackgroundJobAllowed()` skips background execution automatically when `VERCEL_ENV === "preview"`.

---

## 8. Vercel Active CPU Inspection & Debugging Guide

### How to Inspect CPU Usage
1. Open **Vercel Dashboard** -> **Usage** -> **Fluid Active CPU**.
2. Review the breakdown by route and serverless function.
3. Filter logs by `Function Execution Time` > 2000ms.

### Identifying High-Cost Routes
Look for:
- Un-awaited background promises running in serverless background contexts.
- Force-dynamic routes (`export const dynamic = "force-dynamic"`) serving high public traffic.
- Supabase auth middleware calling `getUser()` on unauthenticated guest visits.

---

## 9. Emergency Response: Vercel Project Pause

If Vercel pauses or warns about CPU quota limits:
1. Verify that `revalidate = 3600` ISR caching is active on high-traffic public routes (`/` and `/properties/[slug]`).
2. Ensure `isBackgroundJobAllowed()` is active across all cron/sync handlers.
3. If necessary, temporarily set `DISABLE_BACKGROUND_JOBS=true` in Vercel Production Environment Variables while inspecting logs.
4. Deploy the hardened `perf/vercel-fluid-cpu-hardening` branch to production.

---

## 10. Remaining Risks & Recommended Follow-up Work

1. **Security Migration Execution**:
   - Review and execute the prepared migration `web/supabase/migrations/20260920_security_remediation_proposal.sql` to fix Security Definer views and restrict sensitive financial RPC permissions.
2. **Distributed Job Queue (Future Scale)**:
   - If property volume scales past 1,000 active listings, consider introducing an external queue system (e.g. Upstash QStash or Supabase Pg_cron) for offloading heavy iCal feeds outside serverless execution windows.
