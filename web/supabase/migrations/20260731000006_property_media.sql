-- Thin junctions to the already-live `files` table (bucket/object_key/
-- checksum/thumbnail_key all live there — see docs/STORAGE_ARCHITECTURE.md).
-- Photos and videos get separate tables (not one polymorphic "media" table)
-- because they map 1:1 to different R2 buckets (property-images vs.
-- property-videos) and have different default display treatment.

create table public.property_photos (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  file_id     uuid not null references public.files(id),
  room_id     uuid references public.property_rooms(id), -- nullable: room-wise tagging, optional
  caption     text,
  tags        text[] not null default '{}',              -- e.g. '{"drone","360"}' per brief's gallery tags
  sort_order  integer not null default 0,
  is_cover    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz,
  unique (property_id, file_id)
);

-- At most one cover photo per property.
create unique index property_photos_one_cover_idx on public.property_photos (property_id)
  where is_cover and deleted_at is null;

create table public.property_videos (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  file_id     uuid not null references public.files(id),
  video_type  text not null default 'walkthrough'
                check (video_type in ('walkthrough', 'drone', 'virtual_tour_360')),
  caption     text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz,
  unique (property_id, file_id)
);

create table public.property_documents (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  file_id       uuid not null references public.files(id),
  document_type text not null check (document_type in (
                  'management_agreement', 'owner_agreement', 'insurance', 'tax',
                  'floor_plan', 'gst', 'property_tax', 'electric_bill', 'water_bill',
                  'gas_bill', 'legal', 'other'
                )),
  expiry_date   date, -- for renewable documents (insurance, licenses)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id),
  deleted_at    timestamptz,
  unique (property_id, file_id)
);

create index property_photos_property_idx on public.property_photos (property_id, sort_order) where deleted_at is null;
create index property_videos_property_idx on public.property_videos (property_id) where deleted_at is null;
create index property_documents_property_idx on public.property_documents (property_id, document_type) where deleted_at is null;

create trigger set_updated_at before update on public.property_photos
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_videos
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_documents
  for each row execute function public.set_updated_at();
