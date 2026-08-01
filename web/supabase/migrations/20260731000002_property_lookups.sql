-- Promotes properties.type / properties.status from check-constraint enums
-- to proper lookup tables (per the "permissions are data, not code"
-- philosophy already established for RBAC — a business user should be able
-- to add "Serviced Apartment" or a "Sold" status without a deploy). Safe to
-- do as a clean swap, not an additive alongside-the-old-columns migration:
-- verified zero rows in `properties` and zero application code reading
-- `properties.type`/`.status` as text (only lib/dashboard/overview.ts
-- touches the table, and only via a row-count query).

create table public.property_types (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  is_system   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

create table public.property_status (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  is_system   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

-- Market positioning tier — orthogonal to physical type (a villa can be
-- budget or luxury); see docs/DATABASE_DESIGN.md §4.4.
create table public.property_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

create table public.room_types (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

create trigger set_updated_at before update on public.property_types
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_status
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_categories
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.room_types
  for each row execute function public.set_updated_at();

-- Swap properties.type/status (text, check-constrained) for FK columns.
alter table public.properties add column type_id uuid references public.property_types(id);
alter table public.properties add column status_id uuid references public.property_status(id);
alter table public.properties add column category_id uuid references public.property_categories(id);
alter table public.properties drop constraint properties_type_check;
alter table public.properties drop constraint properties_status_check;
alter table public.properties drop column type;
alter table public.properties drop column status;

create index properties_type_idx on public.properties (type_id) where deleted_at is null;
create index properties_status_idx2 on public.properties (status_id) where deleted_at is null;
create index properties_category_idx on public.properties (category_id) where deleted_at is null;
