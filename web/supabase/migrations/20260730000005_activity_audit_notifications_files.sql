-- activity_logs: human-readable "what happened" feed (login, logout,
-- password change, role change, user/property creation, file upload, ...).
create table public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),
  action      text not null,        -- 'login' | 'logout' | 'password_change' | 'role_change' | ...
  entity_type text,                 -- 'property' | 'user' | 'file' | 'auth.users' | ...
  entity_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

create index activity_logs_user_idx on public.activity_logs (user_id, created_at desc);
create index activity_logs_action_idx on public.activity_logs (action, created_at desc);

create trigger set_updated_at before update on public.activity_logs
  for each row execute function public.set_updated_at();

-- audit_logs: mechanical before/after diff for any row change, independent
-- of activity_logs' human narrative. Populated by a generic trigger so
-- individual feature tables don't need bespoke audit code.
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  table_name  text not null,
  record_id   uuid not null,
  action      text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_values  jsonb,
  new_values  jsonb,
  changed_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

create index audit_logs_table_record_idx on public.audit_logs (table_name, record_id, created_at desc);

create trigger set_updated_at before update on public.audit_logs
  for each row execute function public.set_updated_at();

-- Generic row-change auditor. Attach to any table with:
--   create trigger audit_<table> after insert or update or delete on public.<table>
--     for each row execute function public.record_audit_log();
create or replace function public.record_audit_log()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_logs (table_name, record_id, action, old_values, new_values, changed_by)
  values (
    tg_table_name,
    coalesce(new.id, old.id),
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    auth.uid()
  );
  return coalesce(new, old);
end;
$$;

-- notifications: in-app notification feed per user.
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  body       text,
  type       text not null default 'info', -- 'info' | 'success' | 'warning' | 'error'
  action_url text,
  is_read    boolean not null default false,
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz
);

create index notifications_user_idx on public.notifications (user_id, created_at desc) where deleted_at is null;
create index notifications_unread_idx on public.notifications (user_id) where not is_read and deleted_at is null;

create trigger set_updated_at before update on public.notifications
  for each row execute function public.set_updated_at();
create trigger set_audit_columns before insert or update on public.notifications
  for each row execute function public.set_audit_columns();

-- files: metadata for every object stored in Cloudflare R2. The bucket
-- names here must match src/lib/storage/r2.ts's BUCKETS constant.
create table public.files (
  id            uuid primary key default gen_random_uuid(),
  bucket        text not null check (bucket in (
                  'property-images', 'property-videos', 'agreements', 'documents',
                  'owner-documents', 'investor-documents', 'guest-ids',
                  'maintenance', 'invoices', 'receipts', 'review-images'
                )),
  object_key    text not null,
  original_name text not null,
  mime_type     text not null,
  size_bytes    bigint not null,
  public_url    text,
  is_public     boolean not null default false,
  entity_type   text,      -- 'property' | 'maintenance_ticket' | 'invoice' | ...
  entity_id     uuid,
  uploaded_by   uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id),
  deleted_at    timestamptz,
  unique (bucket, object_key)
);

create index files_entity_idx on public.files (entity_type, entity_id) where deleted_at is null;
create index files_uploaded_by_idx on public.files (uploaded_by) where deleted_at is null;

create trigger set_updated_at before update on public.files
  for each row execute function public.set_updated_at();
create trigger set_audit_columns before insert or update on public.files
  for each row execute function public.set_audit_columns();

-- Now that activity_logs exists, wire the deferred login-tracking trigger
-- from 20260730000003_profiles.sql onto auth.users.
create or replace function public.handle_auth_user_login()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    update public.profiles set last_login_at = new.last_sign_in_at where id = new.id;
    insert into public.activity_logs (user_id, action, entity_type, entity_id)
      values (new.id, 'login', 'auth.users', new.id);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_login
  after update on auth.users
  for each row execute function public.handle_auth_user_login();
