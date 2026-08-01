-- Property FOUNDATION only: identity, location, and who's responsible for
-- it. Deliberately no pricing/booking/revenue columns yet — those belong to
-- the booking engine and revenue management modules, built later on top of
-- this table (see web/CLAUDE.md "Two property concepts" note).

create table public.properties (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null unique,
  type               text not null default 'villa'
                       check (type in ('villa', 'apartment', 'penthouse', 'boutique_stay', 'holiday_home', 'other')),
  status             text not null default 'onboarding'
                       check (status in ('onboarding', 'active', 'inactive', 'archived')),
  country            text not null default 'India',
  state              text,
  city               text,
  address            text,
  latitude           double precision,
  longitude          double precision,
  timezone           text not null default 'Asia/Kolkata',
  currency           text not null default 'INR',
  owner_id           uuid references public.profiles(id),   -- primary property_owner
  primary_investor_id uuid references public.profiles(id),  -- lead investor, if any
  managed_by         uuid references public.profiles(id),   -- assigned property_manager
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid references auth.users(id),
  updated_by         uuid references auth.users(id),
  deleted_at         timestamptz
);

create index properties_status_idx on public.properties (status) where deleted_at is null;
create index properties_owner_idx on public.properties (owner_id) where deleted_at is null;
create index properties_investor_idx on public.properties (primary_investor_id) where deleted_at is null;
create index properties_managed_by_idx on public.properties (managed_by) where deleted_at is null;
create index properties_city_idx on public.properties (city) where deleted_at is null;

create trigger set_updated_at before update on public.properties
  for each row execute function public.set_updated_at();
create trigger set_audit_columns before insert or update on public.properties
  for each row execute function public.set_audit_columns();
create trigger audit_properties after insert or update or delete on public.properties
  for each row execute function public.record_audit_log();
