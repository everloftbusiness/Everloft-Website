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
