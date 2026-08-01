-- Many-to-many: a user can hold more than one role, but the app treats
-- is_primary as "the" role for routing to /dashboard/{role-slug}.

create table public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role_id    uuid not null references public.roles(id) on delete cascade,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  unique (user_id, role_id)
);

create index user_roles_user_idx on public.user_roles (user_id) where deleted_at is null;
create index user_roles_role_idx on public.user_roles (role_id) where deleted_at is null;
-- At most one primary role per user (partial unique index; NULLs/deleted rows excluded).
create unique index user_roles_one_primary_idx on public.user_roles (user_id)
  where is_primary and deleted_at is null;

create trigger set_updated_at before update on public.user_roles
  for each row execute function public.set_updated_at();
create trigger set_audit_columns before insert or update on public.user_roles
  for each row execute function public.set_audit_columns();

-- Central lookup used everywhere permissions need checking: given a user,
-- what permission keys do they hold across all their (non-deleted) roles?
create or replace view public.user_permissions as
select
  ur.user_id,
  p.key as permission_key
from public.user_roles ur
join public.roles r on r.id = ur.role_id and r.deleted_at is null
join public.role_permissions rp on rp.role_id = r.id and rp.deleted_at is null
join public.permissions p on p.id = rp.permission_id and p.deleted_at is null
where ur.deleted_at is null;

-- Security-definer helper for RLS policies: "does the current user hold
-- permission X?" Used instead of hand-rolling the join in every policy.
create or replace function public.authorize(permission_key text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.user_permissions
    where user_id = auth.uid() and permission_key = authorize.permission_key
  );
$$;

-- Security-definer helper: "does the current user hold role slug X?"
create or replace function public.has_role(role_slug text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id and r.deleted_at is null
    where ur.user_id = auth.uid() and ur.deleted_at is null and r.slug = has_role.role_slug
  );
$$;
