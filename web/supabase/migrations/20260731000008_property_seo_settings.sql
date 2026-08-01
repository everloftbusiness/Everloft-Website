-- 1:1 extensions of `properties`, split out from the core table because
-- both are edited independently of the property's core identity and
-- frequently-changed operational settings shouldn't bloat the core row.

create table public.property_seo (
  property_id       uuid primary key references public.properties(id) on delete cascade,
  meta_title        text,
  meta_description  text,
  og_image_file_id  uuid references public.files(id),
  canonical_slug    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);

create table public.property_settings (
  property_id         uuid primary key references public.properties(id) on delete cascade,
  min_stay_nights     integer not null default 1,
  max_stay_nights     integer,
  advance_notice_hours integer not null default 24,       -- "Advance Notice" from the brief
  preparation_time_hours integer not null default 0,      -- turnover buffer between bookings
  check_in_method     text not null default 'host_greeting'
                        check (check_in_method in ('host_greeting', 'self_check_in', 'smart_lock', 'lockbox')),
  has_smart_lock      boolean not null default false,
  instant_book        boolean not null default false,
  currency_override   text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid references auth.users(id),
  updated_by          uuid references auth.users(id)
);

create trigger set_updated_at before update on public.property_seo
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_settings
  for each row execute function public.set_updated_at();
