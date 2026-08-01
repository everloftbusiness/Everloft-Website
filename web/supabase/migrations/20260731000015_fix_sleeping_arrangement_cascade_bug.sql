-- Bug found via manual verification (not theoretical): deleting a property
-- cascades to property_rooms, which cascades to beds — but by the time the
-- AFTER DELETE trigger on `beds` fires and tries to look up its room's
-- property_id (to know which sleeping-arrangement row to refresh), the
-- room itself may already be gone in the same cascade, so the lookup
-- returns NULL and the upsert violated the not-null constraint on
-- property_sleeping_arrangements.property_id. Fix: skip the refresh
-- entirely when the owning property can no longer be resolved — there is
-- nothing to refresh, since property_sleeping_arrangements itself cascades
-- away with the property regardless.

create or replace function public.refresh_sleeping_arrangement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_property_id uuid;
begin
  select r.property_id into target_property_id
  from public.property_rooms r
  where r.id = coalesce(new.room_id, old.room_id);

  if target_property_id is null then
    -- The room (and likely the whole property) is already gone in a
    -- cascading delete — nothing left to refresh.
    return coalesce(new, old);
  end if;

  insert into public.property_sleeping_arrangements (property_id, bed_summary, updated_at)
  select
    target_property_id,
    coalesce(jsonb_agg(jsonb_build_object('type', b.bed_type, 'count', b.quantity)), '[]'::jsonb),
    now()
  from public.beds b
  join public.property_rooms r on r.id = b.room_id
  where r.property_id = target_property_id and b.deleted_at is null
  on conflict (property_id) do update
    set bed_summary = excluded.bed_summary, updated_at = now();

  return coalesce(new, old);
end;
$$;
