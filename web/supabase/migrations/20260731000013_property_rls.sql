-- RLS for the whole Property Management Module. One reusable helper
-- (can_view_property) instead of duplicating an ownership/investor/manager
-- join in ~20 child-table policies — same pattern as the existing
-- authorize()/has_role() functions from the Auth/RBAC migration.

create or replace function public.can_view_property(target_property_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    authorize('manage_properties')
    or exists (
      select 1 from public.properties p
      where p.id = target_property_id
        and (p.owner_id = auth.uid() or p.primary_investor_id = auth.uid() or p.managed_by = auth.uid())
    )
    or exists (select 1 from public.property_owners po where po.property_id = target_property_id and po.owner_id = auth.uid() and po.deleted_at is null)
    or exists (select 1 from public.property_investors pi where pi.property_id = target_property_id and pi.investor_id = auth.uid() and pi.deleted_at is null)
    or exists (select 1 from public.property_managers pm where pm.property_id = target_property_id and pm.manager_id = auth.uid() and pm.deleted_at is null);
$$;

-- Lookup/master tables: readable by any authenticated user (the UI needs
-- these names to render forms/filters), writable only by manage_properties.
do $$
declare
  lookup_table text;
begin
  foreach lookup_table in array array[
    'property_types', 'property_status', 'property_categories', 'room_types',
    'amenity_master', 'utility_types', 'tags'
  ]
  loop
    execute format('alter table public.%I enable row level security;', lookup_table);
    execute format(
      'create policy "%1$s_select_authenticated" on public.%1$s for select to authenticated using (deleted_at is null);',
      lookup_table
    );
    execute format(
      'create policy "%1$s_write_admin" on public.%1$s for all to authenticated using (authorize(''manage_properties'')) with check (authorize(''manage_properties''));',
      lookup_table
    );
  end loop;
end $$;

-- Property-scoped child tables: visible to anyone can_view_property() allows,
-- writable only by manage_properties holders.
do $$
declare
  child_table text;
begin
  foreach child_table in array array[
    'property_amenities', 'property_rooms', 'property_photos', 'property_videos',
    'property_documents', 'property_rules', 'property_policies', 'nearby_attractions',
    'property_tags', 'property_pricing', 'property_pricing_overrides', 'property_taxes',
    'property_insurance', 'property_availability_blocks', 'property_utility_accounts',
    'property_integrations', 'property_owners', 'property_investors', 'property_managers'
  ]
  loop
    execute format('alter table public.%I enable row level security;', child_table);
    execute format(
      'create policy "%1$s_select_scoped" on public.%1$s for select to authenticated using (can_view_property(property_id));',
      child_table
    );
    execute format(
      'create policy "%1$s_write_admin" on public.%1$s for all to authenticated using (authorize(''manage_properties'')) with check (authorize(''manage_properties''));',
      child_table
    );
  end loop;
end $$;

-- beds: scoped via its parent room's property, not a direct property_id column.
alter table public.beds enable row level security;
create policy "beds_select_scoped" on public.beds
  for select to authenticated
  using (exists (select 1 from public.property_rooms r where r.id = beds.room_id and can_view_property(r.property_id)));
create policy "beds_write_admin" on public.beds
  for all to authenticated
  using (authorize('manage_properties')) with check (authorize('manage_properties'));

-- property_sleeping_arrangements: same pattern, PK is property_id directly.
alter table public.property_sleeping_arrangements enable row level security;
create policy "property_sleeping_arrangements_select_scoped" on public.property_sleeping_arrangements
  for select to authenticated using (can_view_property(property_id));
create policy "property_sleeping_arrangements_write_admin" on public.property_sleeping_arrangements
  for all to authenticated
  using (authorize('manage_properties')) with check (authorize('manage_properties'));

-- property_seo / property_settings: 1:1 tables, PK is property_id.
alter table public.property_seo enable row level security;
create policy "property_seo_select_scoped" on public.property_seo
  for select to authenticated using (can_view_property(property_id));
create policy "property_seo_write_admin" on public.property_seo
  for all to authenticated
  using (authorize('manage_properties')) with check (authorize('manage_properties'));

alter table public.property_settings enable row level security;
create policy "property_settings_select_scoped" on public.property_settings
  for select to authenticated using (can_view_property(property_id));
create policy "property_settings_write_admin" on public.property_settings
  for all to authenticated
  using (authorize('manage_properties')) with check (authorize('manage_properties'));
