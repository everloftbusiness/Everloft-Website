-- Amenity master list + property assignment junction. Categories match the
-- brief's list (Internet, Entertainment, Kitchen, Bathroom, Bedroom, Safety,
-- Family, Accessibility, Outdoor, Parking, Heating, Cooling, Laundry,
-- Workspace, Smart Home) as a check constraint (not a lookup table) because
-- amenity categories are a small, stable taxonomy — unlike property
-- types/statuses, there's no realistic business need to add a 16th category
-- without a deploy, so a lookup table here would be over-engineering.

create table public.amenity_master (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  category    text not null check (category in (
                'internet', 'entertainment', 'kitchen', 'bathroom', 'bedroom',
                'safety', 'family', 'accessibility', 'outdoor', 'parking',
                'heating', 'cooling', 'laundry', 'workspace', 'smart_home'
              )),
  icon        text,               -- lucide icon name, rendered client-side
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

create table public.property_amenities (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  amenity_id  uuid not null references public.amenity_master(id),
  notes       text,               -- e.g. "Pool — seasonal, closed Nov-Feb"
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz,
  unique (property_id, amenity_id)
);

create index amenity_master_category_idx on public.amenity_master (category) where deleted_at is null;
create index property_amenities_property_idx on public.property_amenities (property_id) where deleted_at is null;

create trigger set_updated_at before update on public.amenity_master
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_amenities
  for each row execute function public.set_updated_at();
create trigger set_audit_columns before insert or update on public.property_amenities
  for each row execute function public.set_audit_columns();
