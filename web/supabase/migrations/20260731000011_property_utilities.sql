-- One utility_types lookup + one property_utility_accounts table, not five
-- separate electricity/water/gas/internet/association-fee tables — the
-- exact normalization call already made in docs/DATABASE_DESIGN.md §11,
-- applied here for real. Actual bill line-items (docs/DATABASE_DESIGN.md
-- §13.3 `utility_bills`) are a Revenue/Expense-module concern, out of scope
-- for the Property module itself — this migration covers only the
-- per-property utility *account* (provider, account/meter number), the
-- part that genuinely belongs to a property's own record.

create table public.utility_types (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz
);

create table public.property_utility_accounts (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references public.properties(id) on delete cascade,
  utility_type_id uuid not null references public.utility_types(id),
  provider_name   text,
  account_number  text,
  meter_number    text,
  has_solar       boolean not null default false,      -- only meaningful for the "electricity" row
  has_power_backup boolean not null default false,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id),
  updated_by      uuid references auth.users(id),
  deleted_at      timestamptz,
  unique (property_id, utility_type_id)
);

create index property_utility_accounts_property_idx on public.property_utility_accounts
  (property_id) where deleted_at is null;

create trigger set_updated_at before update on public.utility_types
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_utility_accounts
  for each row execute function public.set_updated_at();
