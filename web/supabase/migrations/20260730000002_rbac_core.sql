-- Roles, permissions, and the role<->permission join table.
-- Nothing about "who can do what" is hardcoded in application code — it is
-- always resolved by reading these three tables at request time.

create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,          -- e.g. "super_admin" — stable, code-referenced
  name        text not null,                 -- e.g. "Super Admin" — display label
  description text,
  level       integer not null default 0,    -- higher = broader authority, for future hierarchy checks
  is_system   boolean not null default false, -- seeded roles; blocks accidental deletion, not editing
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

create table public.permissions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,          -- e.g. "manage_properties" — referenced by code
  name        text not null,
  description text,
  category    text not null default 'general', -- groups permissions in future admin UI
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id),
  deleted_at  timestamptz
);

create table public.role_permissions (
  id            uuid primary key default gen_random_uuid(),
  role_id       uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id),
  deleted_at    timestamptz,
  unique (role_id, permission_id)
);

create index roles_slug_idx on public.roles (slug) where deleted_at is null;
create index permissions_key_idx on public.permissions (key) where deleted_at is null;
create index role_permissions_role_idx on public.role_permissions (role_id) where deleted_at is null;
create index role_permissions_permission_idx on public.role_permissions (permission_id) where deleted_at is null;

create trigger set_updated_at before update on public.roles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.permissions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.role_permissions
  for each row execute function public.set_updated_at();

create trigger set_audit_columns before insert or update on public.roles
  for each row execute function public.set_audit_columns();
create trigger set_audit_columns before insert or update on public.permissions
  for each row execute function public.set_audit_columns();
create trigger set_audit_columns before insert or update on public.role_permissions
  for each row execute function public.set_audit_columns();
