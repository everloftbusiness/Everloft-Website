-- Expands the live `properties` foundation table (0 rows — verified before
-- writing this, safe in-place alter) with the full Property Information,
-- Location, and Specification fields from the Property Management Module
-- brief. Ownership/type/status stay as they are for now — promoted to
-- proper lookup tables and junctions in later migrations in this same
-- batch (see 20260731000002 and 20260731000003).

alter table public.properties
  -- Property Information
  add column internal_code text,          -- e.g. "EL-PROP-000123", ops-facing
  add column short_name text,
  add column description text,
  add column short_description text,
  add column highlights text[],           -- short bullet list, e.g. '{"Sea view","Private pool"}'
  add column usp text,                    -- unique selling point, one line

  -- Location (country/state/city/address/lat/long/timezone already exist)
  add column district text,
  add column area text,
  add column street text,
  add column landmark text,
  add column pin_code text,
  add column google_maps_url text,
  add column what3words text,             -- future-ready, e.g. "///filled.count.soap"

  -- Specifications
  add column bedrooms smallint,
  add column bathrooms smallint,
  add column toilets smallint,
  add column living_rooms smallint,
  add column dining_rooms smallint,
  add column has_kitchen boolean not null default true,
  add column has_study_room boolean not null default false,
  add column has_balcony boolean not null default false,
  add column has_terrace boolean not null default false,
  add column has_garden boolean not null default false,
  add column has_swimming_pool boolean not null default false,
  add column has_parking boolean not null default false,
  add column has_garage boolean not null default false,
  add column floor_number text,           -- text, not int: "Ground", "3", "PH" all valid
  add column building_name text,
  add column has_lift boolean not null default false,
  add column property_area_sqft integer,
  add column built_up_area_sqft integer,
  add column plot_area_sqft integer,
  add column max_guests integer,
  add column min_guests integer not null default 1,
  add column year_built integer,
  add column last_renovated_year integer;

comment on column public.properties.internal_code is
  'Ops-facing short code, distinct from the public-facing slug used in guest-side URLs.';
