-- Property's own configured RATE CARD (what the owner/ops team sets), not
-- booking transactions or recognized revenue — those stay explicitly out of
-- scope until the Booking/Revenue modules exist (docs/DATABASE_DESIGN.md
-- §7/§9). "Property Pricing" here answers "what does this property charge,"
-- never "what did a specific stay actually cost" — that distinction is the
-- same one already drawn for `properties` itself in the Auth/RBAC pass.

create table public.property_pricing (
  property_id            uuid primary key references public.properties(id) on delete cascade,
  base_price             numeric(12,2) not null,
  weekend_price          numeric(12,2),          -- nullable: falls back to base_price if unset
  monthly_price          numeric(12,2),
  weekly_discount_percent numeric(5,2) not null default 0,
  monthly_discount_percent numeric(5,2) not null default 0,
  extra_guest_fee        numeric(12,2) not null default 0,
  extra_guest_after      integer,                -- fee applies beyond this many guests; null = base_max_guests
  cleaning_fee           numeric(12,2) not null default 0,
  management_fee_percent numeric(5,2) not null default 0,
  currency               text not null default 'INR',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  created_by             uuid references auth.users(id),
  updated_by             uuid references auth.users(id)
);

-- Seasonal AND holiday pricing unified into one date-ranged override table
-- (not two separate tables) — both answer the identical question ("what
-- overrides the base price between these two dates"), just with a
-- different `override_type` label; splitting them would mean duplicating
-- the exact same overlap-resolution logic (`priority`) twice for no
-- functional difference. Same normalization reasoning already applied to
-- utility bills in docs/DATABASE_DESIGN.md §11.
create table public.property_pricing_overrides (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  override_type text not null check (override_type in ('seasonal', 'holiday')),
  name          text not null,        -- "Christmas & New Year", "Monsoon Season"
  start_date    date not null,
  end_date      date not null,
  price         numeric(12,2) not null,
  priority      integer not null default 0, -- higher wins when date ranges overlap
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id),
  deleted_at    timestamptz,
  check (end_date >= start_date)
);

create table public.property_taxes (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  tax_name     text not null,               -- "GST", "Kerala Luxury Tax"
  tax_type     text not null check (tax_type in ('gst', 'vat', 'occupancy_tax', 'luxury_tax', 'other')),
  rate_percent numeric(5,2) not null,
  is_inclusive boolean not null default false, -- true: base_price already includes this tax
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id),
  deleted_at   timestamptz
);

create table public.property_insurance (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references public.properties(id) on delete cascade,
  provider_name   text not null,
  policy_number   text not null,
  coverage_type   text,             -- "fire", "flood", "comprehensive"
  coverage_amount numeric(14,2),
  currency        text not null default 'INR',
  start_date      date not null,
  end_date        date not null,
  document_file_id uuid references public.files(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id),
  updated_by      uuid references auth.users(id),
  deleted_at      timestamptz,
  check (end_date >= start_date)
);

create index property_pricing_overrides_property_idx on public.property_pricing_overrides
  (property_id, start_date, end_date) where deleted_at is null;
create index property_taxes_property_idx on public.property_taxes (property_id) where deleted_at is null;
create index property_insurance_property_idx on public.property_insurance (property_id) where deleted_at is null;
create index property_insurance_expiry_idx on public.property_insurance (end_date) where deleted_at is null;

create trigger set_updated_at before update on public.property_pricing
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_pricing_overrides
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_taxes
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_insurance
  for each row execute function public.set_updated_at();
