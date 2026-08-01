-- Expands the live `files` table (0 rows today — verified before writing this
-- migration, so every change below is a safe in-place alter, not a data
-- migration) into the fuller enterprise file-asset model. Table name stays
-- `files` for continuity with existing RLS policies/indexes/FKs already
-- referencing it — "file_assets" in the design brief is the same concept,
-- not a second table (see docs/STORAGE_ARCHITECTURE.md §4 for why).

-- Rename to the ownership vocabulary used across the rest of the schema
-- (docs/DATABASE_DESIGN.md already uses owner_type/owner_id-style polymorphic
-- references elsewhere, e.g. notes/approvals) rather than entity_type/id.
alter table public.files rename column entity_type to owner_type;
alter table public.files rename column entity_id to owner_id;

alter table public.files
  add column folder_path text,
  add column extension text,
  add column checksum text,
  add column thumbnail_key text,
  add column status text not null default 'active'
    check (status in ('active', 'processing', 'failed', 'archived')),
  add column metadata jsonb not null default '{}'::jsonb,
  add column version integer not null default 1,
  add column previous_version_id uuid references public.files(id);

-- Expanded bucket list — see docs/STORAGE_ARCHITECTURE.md §2 for what each is
-- for. Widening this check constraint is additive; no existing row (there
-- are none) is invalidated by it.
alter table public.files drop constraint files_bucket_check;
alter table public.files add constraint files_bucket_check check (bucket in (
  'property-images', 'property-videos', 'property-documents',
  'owner-documents', 'investor-documents', 'guest-documents',
  'maintenance', 'housekeeping', 'agreements', 'reports', 'invoices',
  'receipts', 'utility-bills', 'floor-plans', 'avatars', 'company-assets',
  'temp-uploads', 'backups', 'ai-generated', 'review-images'
));

drop index if exists files_entity_idx;
create index files_owner_idx on public.files (owner_type, owner_id) where deleted_at is null;
create index files_checksum_idx on public.files (checksum) where deleted_at is null;
create index files_folder_path_idx on public.files (bucket, folder_path) where deleted_at is null;
create index files_status_idx on public.files (status) where status != 'active';
create index files_previous_version_idx on public.files (previous_version_id) where previous_version_id is not null;
