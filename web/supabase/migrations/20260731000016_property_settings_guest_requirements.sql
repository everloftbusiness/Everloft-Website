-- Additive columns for the Property Setup Dashboard's "Guest Requirements"
-- section (docs/PROPERTY_ONBOARDING_EXPERIENCE.md §14) — flagged in that
-- document as needed when this dashboard was actually built. Building it
-- now.
alter table public.property_settings
  add column requires_government_id boolean not null default false,
  add column requires_good_reviews boolean not null default false,
  add column requires_host_approval boolean not null default false;
