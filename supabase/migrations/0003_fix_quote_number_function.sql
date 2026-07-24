-- Fixes "new row violates row-level security policy for table quote_number_counters"
-- when creating a quote. generate_quote_number() needs to manage its internal
-- counter table regardless of the calling user's row-level security policies,
-- so it must run as a security definer function (like handle_new_user()).
-- Run this in the Supabase SQL Editor after 0002_storage.sql.

create or replace function generate_quote_number()
returns text as $$
declare
  yr int := extract(year from now() at time zone 'Australia/Brisbane');
  next_num int;
begin
  insert into quote_number_counters (year, last_number)
  values (yr, 1)
  on conflict (year) do update set last_number = quote_number_counters.last_number + 1
  returning last_number into next_num;

  return 'Q-' || yr || '-' || lpad(next_num::text, 4, '0');
end;
$$ language plpgsql security definer set search_path = public;

alter table quote_number_counters enable row level security;

do $$ begin
  create policy "authenticated_full_access" on quote_number_counters
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
