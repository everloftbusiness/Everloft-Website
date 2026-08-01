-- Many-to-many ownership/investment/management — the single owner_id/
-- primary_investor_id/managed_by columns on `properties` stay as cheap
-- "who's primary" convenience lookups; these junctions hold the full
-- multi-party truth (co-owned properties, multiple investors, a management
-- team), exactly the additive extension already planned in
-- docs/DATABASE_DESIGN.md §4.7-4.9.

create table public.property_owners (
  id                uuid primary key default gen_random_uuid(),
  property_id       uuid not null references public.properties(id) on delete cascade,
  owner_id          uuid not null references public.profiles(id),
  ownership_percent numeric(5,2) not null default 100,
  is_primary        boolean not null default true,
  effective_from    date not null default current_date,
  effective_to      date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  deleted_at        timestamptz,
  unique (property_id, owner_id)
);

create table public.property_investors (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  investor_id    uuid not null references public.profiles(id),
  stake_percent  numeric(5,2) not null,
  is_primary     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references auth.users(id),
  updated_by     uuid references auth.users(id),
  deleted_at     timestamptz,
  unique (property_id, investor_id)
);

create table public.property_managers (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  manager_id     uuid not null references public.profiles(id),
  assigned_from  date not null default current_date,
  assigned_to    date,
  is_lead        boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references auth.users(id),
  updated_by     uuid references auth.users(id),
  deleted_at     timestamptz,
  unique (property_id, manager_id)
);

create index property_owners_property_idx on public.property_owners (property_id) where deleted_at is null;
create index property_owners_owner_idx on public.property_owners (owner_id) where deleted_at is null;
create index property_investors_property_idx on public.property_investors (property_id) where deleted_at is null;
create index property_investors_investor_idx on public.property_investors (investor_id) where deleted_at is null;
create index property_managers_property_idx on public.property_managers (property_id) where deleted_at is null;
create index property_managers_manager_idx on public.property_managers (manager_id) where deleted_at is null;

create trigger set_updated_at before update on public.property_owners
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_investors
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_managers
  for each row execute function public.set_updated_at();

create trigger set_audit_columns before insert or update on public.property_owners
  for each row execute function public.set_audit_columns();
create trigger set_audit_columns before insert or update on public.property_investors
  for each row execute function public.set_audit_columns();
create trigger set_audit_columns before insert or update on public.property_managers
  for each row execute function public.set_audit_columns();
