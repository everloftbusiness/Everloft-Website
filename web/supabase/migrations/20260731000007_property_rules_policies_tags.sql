-- House rules, structured policies (cancellation/check-in/check-out/pet/
-- deposit), nearby attractions, and a shared tags master (reused by any
-- future taggable entity, not property-specific by name).

create table public.property_rules (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  rule_key    text not null check (rule_key in (
                'quiet_hours', 'smoking', 'pets', 'visitors', 'parties',
                'commercial_shoots', 'alcohol', 'id_required', 'minimum_age',
                'cleaning', 'waste_disposal', 'parking', 'community', 'other'
              )),
  rule_text   text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

create table public.property_policies (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  policy_type  text not null check (policy_type in (
                 'cancellation', 'check_in', 'check_out', 'pet', 'damage_deposit'
               )),
  policy_value jsonb not null, -- flexible per type, e.g. cancellation: {"tiers":[{"days_before":7,"refund_pct":100}]}
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id),
  deleted_at   timestamptz,
  unique (property_id, policy_type)
);

-- check_in_time/check_out_time/security_deposit as direct property-level
-- columns (used constantly, worth a fast direct read rather than a jsonb
-- unwrap every time) — added here rather than the specs migration since
-- they're policy-adjacent, not physical specs.
alter table public.properties
  add column check_in_time time,
  add column check_out_time time,
  add column security_deposit_amount numeric(12,2),
  add column security_deposit_currency text;

create table public.nearby_attractions (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  name         text not null,
  category     text not null check (category in ('beach', 'restaurant', 'landmark', 'shopping', 'transport', 'other')),
  distance_km  numeric(5,2),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id),
  deleted_at   timestamptz
);

create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz
);

create table public.property_tags (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tag_id      uuid not null references public.tags(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz,
  unique (property_id, tag_id)
);

create index property_rules_property_idx on public.property_rules (property_id) where deleted_at is null;
create index property_policies_property_idx on public.property_policies (property_id) where deleted_at is null;
create index nearby_attractions_property_idx on public.nearby_attractions (property_id) where deleted_at is null;
create index property_tags_property_idx on public.property_tags (property_id) where deleted_at is null;

create trigger set_updated_at before update on public.property_rules
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_policies
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.nearby_attractions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tags
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_tags
  for each row execute function public.set_updated_at();
