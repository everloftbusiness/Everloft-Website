-- Owner/ops-initiated date blocking ("block these dates for personal use,"
-- "block for renovation") — deliberately NOT a booking calendar/availability
-- engine. Actual guest bookings and the derived "is this property available
-- on date X" query belong to the future Booking module
-- (docs/DATABASE_DESIGN.md §7), which doesn't exist yet. This table only
-- answers "did a human explicitly block this date range," the one piece of
-- "Property Calendar/Availability" that is genuinely a property-management
-- concern rather than a booking-engine concern.

create table public.property_availability_blocks (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  block_type   text not null check (block_type in ('owner_use', 'maintenance', 'renovation', 'other')),
  start_date   date not null,
  end_date     date not null,
  reason       text,
  created_by_user uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id),
  deleted_at   timestamptz,
  check (end_date >= start_date)
);

create index property_availability_blocks_property_idx on public.property_availability_blocks
  (property_id, start_date, end_date) where deleted_at is null;

create trigger set_updated_at before update on public.property_availability_blocks
  for each row execute function public.set_updated_at();
create trigger set_audit_columns before insert or update on public.property_availability_blocks
  for each row execute function public.set_audit_columns();
