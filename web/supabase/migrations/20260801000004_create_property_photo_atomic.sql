-- Serialize cover-photo selection on the parent property row. This prevents
-- concurrent uploads from all observing an empty gallery and each attempting
-- to claim the one-cover partial unique index.
create or replace function public.create_property_photo(
  p_property_id uuid,
  p_file_id uuid,
  p_sort_order integer
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_photo_id uuid;
  should_be_cover boolean;
begin
  perform 1 from public.properties where id = p_property_id for update;
  if not found then
    raise exception 'Property not found';
  end if;

  select not exists (
    select 1
    from public.property_photos
    where property_id = p_property_id
      and is_cover
      and deleted_at is null
  ) into should_be_cover;

  insert into public.property_photos (
    property_id,
    file_id,
    sort_order,
    is_cover,
    created_by,
    updated_by
  ) values (
    p_property_id,
    p_file_id,
    p_sort_order,
    should_be_cover,
    auth.uid(),
    auth.uid()
  ) returning id into new_photo_id;

  return new_photo_id;
end;
$$;

revoke all on function public.create_property_photo(uuid, uuid, integer) from public;
grant execute on function public.create_property_photo(uuid, uuid, integer) to authenticated;
