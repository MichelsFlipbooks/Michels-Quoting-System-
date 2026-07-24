-- Storage bucket for issued client-quote PDFs.
-- Run this in the Supabase SQL Editor after 0001_init.sql.

insert into storage.buckets (id, name, public)
values ('quote-pdfs', 'quote-pdfs', true)
on conflict (id) do nothing;

do $$ begin
  create policy "authenticated_read_quote_pdfs" on storage.objects
    for select to authenticated using (bucket_id = 'quote-pdfs');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated_write_quote_pdfs" on storage.objects
    for insert to authenticated with check (bucket_id = 'quote-pdfs');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated_update_quote_pdfs" on storage.objects
    for update to authenticated using (bucket_id = 'quote-pdfs');
exception when duplicate_object then null; end $$;
