-- Michels Quoting System — Phase 1 initial schema
-- Run this in the Supabase SQL Editor (or via `supabase db push` if using the CLI).
-- Safe to re-run: guarded with IF NOT EXISTS / DROP IF EXISTS where sensible.

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================================
-- ENUMS
-- ============================================================================
do $$ begin
  create type catalogue_category as enum
    ('food', 'beverage', 'staffing', 'equipment', 'delivery_travel', 'additional_charge');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gst_status_type as enum ('gst_applicable', 'gst_free');
exception when duplicate_object then null; end $$;

do $$ begin
  create type package_pricing_type as enum ('per_guest', 'fixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type money_adjustment_type as enum ('percentage', 'fixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type quote_status as enum
    ('enquiry', 'quote_in_progress', 'quote_sent', 'follow_up_due',
     'confirmed', 'completed', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type line_item_type as enum ('package', 'catalogue_item', 'custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type audit_action_type as enum
    ('quote_created', 'quote_changed', 'quote_sent', 'status_changed',
     'quote_confirmed', 'quote_rejected', 'quote_cancelled',
     'price_overridden', 'discount_applied', 'pdf_generated');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- HELPER: updated_at trigger
-- ============================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- PROFILES (extends auth.users — one row per Michels staff member)
-- ============================================================================
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new Supabase auth user is created.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================================
-- CLIENTS
-- ============================================================================
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  organisation text,
  email text,
  phone text,
  billing_address text,
  delivery_address text,
  notes text,
  preferences text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_clients_email on clients (lower(email));
create index if not exists idx_clients_organisation on clients (lower(organisation));

drop trigger if exists trg_clients_updated_at on clients;
create trigger trg_clients_updated_at before update on clients
  for each row execute procedure set_updated_at();

-- ============================================================================
-- DIETARY REQUIREMENTS (lookup)
-- ============================================================================
create table if not exists dietary_requirements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true
);

-- ============================================================================
-- CATALOGUE ITEMS (reusable picklist for all flexible line-item sections)
-- ============================================================================
create table if not exists catalogue_items (
  id uuid primary key default gen_random_uuid(),
  category catalogue_category not null,
  name text not null,
  description text,
  internal_description text,
  default_unit text not null default 'each',
  default_unit_price_cents bigint not null default 0,
  default_internal_cost_cents bigint not null default 0,
  default_gst_status gst_status_type not null default 'gst_applicable',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_catalogue_items_category on catalogue_items (category) where active;

drop trigger if exists trg_catalogue_items_updated_at on catalogue_items;
create trigger trg_catalogue_items_updated_at before update on catalogue_items
  for each row execute procedure set_updated_at();

-- ============================================================================
-- CATERING PACKAGES
-- ============================================================================
create table if not exists catering_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  pricing_type package_pricing_type not null default 'per_guest',
  price_per_guest_cents bigint,
  fixed_price_cents bigint,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_package_pricing check (
    (pricing_type = 'per_guest' and price_per_guest_cents is not null)
    or (pricing_type = 'fixed' and fixed_price_cents is not null)
  )
);

drop trigger if exists trg_catering_packages_updated_at on catering_packages;
create trigger trg_catering_packages_updated_at before update on catering_packages
  for each row execute procedure set_updated_at();

-- Template of what's included in / optionally added to a package.
create table if not exists package_menu_selections (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references catering_packages (id) on delete cascade,
  catalogue_item_id uuid references catalogue_items (id),
  custom_name text,
  is_optional_addon boolean not null default false,
  addon_price_cents bigint,
  sort_order int not null default 0,
  constraint chk_selection_named check (catalogue_item_id is not null or custom_name is not null)
);
create index if not exists idx_package_menu_selections_package on package_menu_selections (package_id);

-- ============================================================================
-- QUOTE NUMBERING (sequential per calendar year: Q-2026-0001)
-- ============================================================================
create table if not exists quote_number_counters (
  year int primary key,
  last_number int not null default 0
);

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

-- ============================================================================
-- QUOTES (core entity — a quote IS an event; status carries it through the
-- lifecycle from enquiry to confirmed/completed, or rejected/cancelled)
-- ============================================================================
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique default generate_quote_number(),
  client_id uuid not null references clients (id),

  status quote_status not null default 'enquiry',
  status_reason text,
  next_follow_up_date date,

  event_name text,
  event_type text,
  service_level text,
  event_date date,
  start_time time,
  finish_time time,
  venue_name text,
  venue_address text,
  guest_numbers int,
  event_contact_name text,
  event_contact_phone text,
  access_notes text,
  parking_loading_details text,
  kitchen_facilities text,
  client_budget_cents bigint,
  internal_notes text,
  client_notes text,

  discount_type money_adjustment_type,
  discount_value numeric(12, 2) default 0,
  deposit_type money_adjustment_type not null default 'percentage',
  deposit_value numeric(12, 2) not null default 20,

  quote_date date not null default (now() at time zone 'Australia/Brisbane')::date,
  expiry_date date,
  current_version_number int not null default 0,

  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_status_reason check (
    status not in ('rejected', 'cancelled') or status_reason is not null
  )
);
create index if not exists idx_quotes_status on quotes (status);
create index if not exists idx_quotes_event_date on quotes (event_date);
create index if not exists idx_quotes_client on quotes (client_id);
create index if not exists idx_quotes_quote_number on quotes (quote_number);

drop trigger if exists trg_quotes_updated_at on quotes;
create trigger trg_quotes_updated_at before update on quotes
  for each row execute procedure set_updated_at();

-- ============================================================================
-- QUOTE LINE ITEMS (live/draft — one flexible table for all 6 sections)
-- ============================================================================
create table if not exists quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes (id) on delete cascade,
  section catalogue_category not null,
  line_type line_item_type not null default 'custom',
  catalogue_item_id uuid references catalogue_items (id),
  package_id uuid references catering_packages (id),
  parent_line_item_id uuid references quote_line_items (id) on delete cascade,

  description text not null,
  internal_description text,
  quantity numeric(12, 2) not null default 1,
  unit text not null default 'each',
  unit_price_cents bigint not null default 0,
  hours numeric(6, 2), -- staffing only: total = quantity (staff count) x hours x unit_price
  gst_status gst_status_type not null default 'gst_applicable',
  internal_cost_cents bigint not null default 0,

  is_included_selection boolean not null default false,
  is_addon boolean not null default false,
  sort_order int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_quote_line_items_quote on quote_line_items (quote_id, section, sort_order);
create index if not exists idx_quote_line_items_parent on quote_line_items (parent_line_item_id);

drop trigger if exists trg_quote_line_items_updated_at on quote_line_items;
create trigger trg_quote_line_items_updated_at before update on quote_line_items
  for each row execute procedure set_updated_at();

-- ============================================================================
-- QUOTE <-> DIETARY REQUIREMENTS (join)
-- ============================================================================
create table if not exists quote_dietary_requirements (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes (id) on delete cascade,
  dietary_requirement_id uuid not null references dietary_requirements (id),
  guest_count int,
  notes text,
  unique (quote_id, dietary_requirement_id)
);

-- ============================================================================
-- QUOTE VERSIONS (immutable history — never overwrite an issued quote)
-- ============================================================================
create table if not exists quote_versions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes (id) on delete cascade,
  version_number int not null,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  reason_for_revision text,
  previous_total_cents bigint,
  new_total_cents bigint not null,
  snapshot_data jsonb not null,
  pdf_url text,
  unique (quote_id, version_number)
);
create index if not exists idx_quote_versions_quote on quote_versions (quote_id, version_number);

-- ============================================================================
-- EVENT TIMELINE ITEMS (kitchen/ops copy — run sheet)
-- ============================================================================
create table if not exists event_timeline_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes (id) on delete cascade,
  time time,
  description text not null,
  sort_order int not null default 0
);
create index if not exists idx_event_timeline_items_quote on event_timeline_items (quote_id, sort_order);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes (id) on delete set null,
  user_id uuid references profiles (id),
  action audit_action_type not null,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_logs_quote on audit_logs (quote_id, created_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Phase 1: any authenticated Michels staff member can read/write everything.
-- This is an internal tool only — no client-facing portal in this phase.
-- ============================================================================
alter table profiles enable row level security;
alter table clients enable row level security;
alter table catalogue_items enable row level security;
alter table catering_packages enable row level security;
alter table package_menu_selections enable row level security;
alter table dietary_requirements enable row level security;
alter table quotes enable row level security;
alter table quote_line_items enable row level security;
alter table quote_dietary_requirements enable row level security;
alter table quote_versions enable row level security;
alter table event_timeline_items enable row level security;
alter table audit_logs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'clients', 'catalogue_items', 'catering_packages',
    'package_menu_selections', 'dietary_requirements', 'quotes',
    'quote_line_items', 'quote_dietary_requirements', 'quote_versions',
    'event_timeline_items', 'audit_logs'
  ]
  loop
    execute format(
      'drop policy if exists "authenticated_full_access" on %I;', t
    );
    execute format(
      'create policy "authenticated_full_access" on %I for all to authenticated using (true) with check (true);', t
    );
  end loop;
end $$;
