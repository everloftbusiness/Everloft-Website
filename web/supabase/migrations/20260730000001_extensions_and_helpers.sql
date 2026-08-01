-- Everloft PMS foundation
-- Extensions + shared helper functions used by every later migration.

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- case-insensitive email storage

-- Every table gets created_at/updated_at/created_by/updated_by/deleted_at.
-- This trigger keeps updated_at correct without repeating it in app code.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Stamps created_by/updated_by from the requesting user automatically when
-- the row is written through the normal (RLS-governed) Supabase client.
-- Service-role writes (migrations, seeds, triggers) can pass NULL/explicit
-- values, which is why these columns stay nullable.
create or replace function public.set_audit_columns()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_by := coalesce(new.updated_by, auth.uid());
  elsif tg_op = 'UPDATE' then
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;
