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

### 1. Dev Server & URLs
- **Start Dev Server (Windows/PowerShell):** `npm.cmd run dev` (run inside `web/`)
- **Local Site URL:** [http://localhost:3000](http://localhost:3000)
- **Login Page:** [http://localhost:3000/login](http://localhost:3000/login)
- **Properties List:** [http://localhost:3000/dashboard/properties](http://localhost:3000/dashboard/properties)
- **Add Property:** [http://localhost:3000/dashboard/properties/new](http://localhost:3000/dashboard/properties/new)
- **Super Admin Workspace:** [http://localhost:3000/dashboard/super-admin](http://localhost:3000/dashboard/super-admin)
- **Platform Overview:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

### 2. Seeded Test Accounts (Supabase Auth)
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

