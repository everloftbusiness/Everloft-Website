-- One profile row per Supabase Auth user. auth.users itself is managed by
-- Supabase and only holds credentials; everything human-facing lives here.

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  email         citext not null,
  phone         text,
  country       text,
  state         text,
  city          text,
  avatar_url    text,
  language      text not null default 'en',
  timezone      text not null default 'Asia/Kolkata',
  currency      text not null default 'INR',
  status        text not null default 'active'
                  check (status in ('active', 'invited', 'suspended', 'deactivated')),
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id),
  deleted_at    timestamptz
);

create index profiles_email_idx on public.profiles (email) where deleted_at is null;
create index profiles_status_idx on public.profiles (status) where deleted_at is null;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile the moment a new auth.users row appears (invite
-- acceptance, admin-created account, future OAuth/magic-link sign-in).
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- The last_sign_in_at -> activity_logs sync trigger is defined in
-- 20260730000005_activity_audit_notifications_files.sql once activity_logs
-- exists (Postgres can't reference a not-yet-created table here).
