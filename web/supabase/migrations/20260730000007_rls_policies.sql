-- Row Level Security for every table. Policies lean on the authorize()/
-- has_role() helpers from 20260730000004_user_roles.sql so permission
-- logic lives in one place (the DB), never duplicated per policy.

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.activity_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.files enable row level security;
alter table public.properties enable row level security;

-- roles / permissions / role_permissions: any authenticated user can read
-- (the UI needs role/permission names to render), only RBAC admins write.
create policy "roles_select_authenticated" on public.roles
  for select to authenticated using (deleted_at is null);
create policy "roles_write_rbac_admin" on public.roles
  for all to authenticated
  using (authorize('manage_roles')) with check (authorize('manage_roles'));

create policy "permissions_select_authenticated" on public.permissions
  for select to authenticated using (deleted_at is null);
create policy "permissions_write_rbac_admin" on public.permissions
  for all to authenticated
  using (authorize('manage_permissions')) with check (authorize('manage_permissions'));

create policy "role_permissions_select_authenticated" on public.role_permissions
  for select to authenticated using (deleted_at is null);
create policy "role_permissions_write_rbac_admin" on public.role_permissions
  for all to authenticated
  using (authorize('manage_roles')) with check (authorize('manage_roles'));

-- profiles: everyone can see their own; manage_users holders see/edit all.
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or authorize('manage_users'));
create policy "profiles_update_own_or_admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or authorize('manage_users'))
  with check (id = auth.uid() or authorize('manage_users'));

-- user_roles: users can see their own role assignments; only manage_users
-- holders can see/assign everyone's.
create policy "user_roles_select_own_or_admin" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or authorize('manage_users'));
create policy "user_roles_write_admin" on public.user_roles
  for all to authenticated
  using (authorize('manage_users')) with check (authorize('manage_users'));

-- activity_logs: users see their own activity; view_reports/manage_users
-- holders see everyone's. Inserts allowed for one's own user_id (client-side
-- activity logging) in addition to the backend/service role.
create policy "activity_logs_select_own_or_reporting" on public.activity_logs
  for select to authenticated
  using (user_id = auth.uid() or authorize('view_reports') or authorize('manage_users'));
create policy "activity_logs_insert_own" on public.activity_logs
  for insert to authenticated
  with check (user_id = auth.uid());

-- audit_logs: sensitive diff history — reporting/admin roles only. Writes
-- happen exclusively through the security-definer record_audit_log()
-- trigger (owned by the migration role, which bypasses RLS), so there is
-- deliberately no insert policy for regular authenticated users here.
create policy "audit_logs_select_reporting" on public.audit_logs
  for select to authenticated
  using (authorize('view_reports') or authorize('manage_users'));

-- notifications: strictly your own feed. Rows are created by backend logic
-- using the service-role key, which bypasses RLS — no insert policy needed.
create policy "notifications_select_own" on public.notifications
  for select to authenticated
  using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- files: uploader can manage their own; manage_users/manage_properties
-- holders can see everything (needed for admin review of documents).
create policy "files_select_own_or_admin" on public.files
  for select to authenticated
  using (
    uploaded_by = auth.uid()
    or authorize('manage_properties')
    or authorize('manage_users')
  );
create policy "files_insert_own" on public.files
  for insert to authenticated
  with check (uploaded_by = auth.uid());
create policy "files_update_own_or_admin" on public.files
  for update to authenticated
  using (uploaded_by = auth.uid() or authorize('manage_users'))
  with check (uploaded_by = auth.uid() or authorize('manage_users'));

-- properties: visible to the owner/investor/manager it's assigned to, plus
-- anyone holding manage_properties. Only manage_properties holders write.
create policy "properties_select_assigned_or_admin" on public.properties
  for select to authenticated
  using (
    owner_id = auth.uid()
    or primary_investor_id = auth.uid()
    or managed_by = auth.uid()
    or authorize('manage_properties')
  );
create policy "properties_write_admin" on public.properties
  for all to authenticated
  using (authorize('manage_properties')) with check (authorize('manage_properties'));
