-- Pricing expansion — docs/PROPERTY_SETUP_DASHBOARD_V2_IMPROVEMENTS.md §8.
-- New direct columns for fields that are genuinely 1:1 with a property
-- (Base Pricing/Guest Pricing groups), plus two new normalized tables for
-- Discounts and Fees (both have an enable/type/value/condition shape in
-- common — a table per discount/fee type would just repeat that shape N
-- times, the same normalization reasoning already used for
-- property_pricing_overrides and utility_bills elsewhere in this schema).
-- The Taxes group needs no schema change at all — property_taxes already
-- supports arbitrary named tax rows with is_inclusive.

alter table public.property_pricing
  add column weekday_price numeric(12,2),
  add column min_nightly_price numeric(12,2),
  add column max_nightly_price numeric(12,2),
  add column standard_occupancy integer,
  add column child_fee numeric(12,2) not null default 0,
  add column infant_fee numeric(12,2) not null default 0,
  add column pet_fee numeric(12,2) not null default 0,
  add column visitor_fee numeric(12,2) not null default 0;

alter table public.property_settings
  add column same_day_booking_allowed boolean not null default true,
  add column same_day_cutoff_time time;

create table public.property_discounts (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  discount_type  text not null check (discount_type in (
                   'last_minute', 'early_bird', 'non_refundable', 'long_stay',
                   'repeat_guest', 'promo_coupon', 'first_booking', 'seasonal_promo'
                 )),
  value_percent  numeric(5,2) not null,
  coupon_code    text,                        -- only meaningful for promo_coupon
  conditions     jsonb not null default '{}'::jsonb, -- e.g. {"min_nights": 28} for long_stay
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references auth.users(id),
  updated_by     uuid references auth.users(id),
  deleted_at     timestamptz
);

create table public.property_fees (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  fee_type      text not null check (fee_type in (
                  'linen', 'laundry', 'resort', 'service', 'utility',
                  'damage_waiver', 'late_checkout', 'early_checkin', 'extra_bed'
                )),
  amount        numeric(12,2) not null,
  is_percentage boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id),
  deleted_at    timestamptz
);

create index property_discounts_property_idx on public.property_discounts (property_id) where deleted_at is null;
create index property_fees_property_idx on public.property_fees (property_id) where deleted_at is null;

create trigger set_updated_at before update on public.property_discounts
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_fees
  for each row execute function public.set_updated_at();

alter table public.property_discounts enable row level security;
create policy "property_discounts_select_scoped" on public.property_discounts
  for select to authenticated using (can_view_property(property_id));
create policy "property_discounts_write_admin" on public.property_discounts
  for all to authenticated using (authorize('manage_properties')) with check (authorize('manage_properties'));

alter table public.property_fees enable row level security;
create policy "property_fees_select_scoped" on public.property_fees
  for select to authenticated using (can_view_property(property_id));
create policy "property_fees_write_admin" on public.property_fees
  for all to authenticated using (authorize('manage_properties')) with check (authorize('manage_properties'));
