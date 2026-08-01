-- OTA channel listing records — one row per (property, channel). Storing
-- sync status here (not a full sync engine, which belongs to the future
-- Booking module's OTA integration layer) because "is this listing live on
-- Airbnb, what's its URL, when did it last sync" is property metadata a
-- property manager needs to see today, independent of whether automated
-- sync exists yet.

create table public.property_integrations (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  channel       text not null check (channel in (
                  'airbnb', 'booking_com', 'agoda', 'makemytrip', 'goibibo',
                  'vrbo', 'direct'
                )),
  listing_id    text,          -- the OTA's own listing/property ID
  listing_url   text,
  status        text not null default 'inactive'
                  check (status in ('inactive', 'active', 'paused', 'error')),
  sync_status   text not null default 'never_synced'
                  check (sync_status in ('never_synced', 'syncing', 'synced', 'failed')),
  last_synced_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id),
  deleted_at    timestamptz,
  unique (property_id, channel)
);

create index property_integrations_property_idx on public.property_integrations (property_id) where deleted_at is null;

create trigger set_updated_at before update on public.property_integrations
  for each row execute function public.set_updated_at();
create trigger set_audit_columns before insert or update on public.property_integrations
  for each row execute function public.set_audit_columns();
