-- BDM tracking, event/client contact split, venue/Google Maps fields, and
-- North-Queensland delivery & travel logistics.
-- Everything here is additive (new table + nullable columns) — safe to run
-- against a database that already has real quotes/clients in it.
-- Run this in the Supabase SQL Editor after 0003_fix_quote_number_function.sql.

-- ============================================================================
-- STAFF MEMBERS (assigned-team-member / "managed by" dropdowns)
-- ============================================================================
create table if not exists staff_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role_title text,
  email text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table staff_members enable row level security;

do $$ begin
  create policy "authenticated_full_access" on staff_members
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

-- ============================================================================
-- QUOTES: event contact split ("same as client" tick box)
-- ============================================================================
alter table quotes
  add column if not exists event_contact_email text,
  add column if not exists event_contact_role text,
  add column if not exists event_contact_same_as_client boolean not null default false;

-- ============================================================================
-- QUOTES: venue / Google Maps fields
-- ============================================================================
alter table quotes
  add column if not exists venue_place_id text,
  add column if not exists venue_lat numeric(9, 6),
  add column if not exists venue_lng numeric(9, 6),
  add column if not exists venue_street_address text,
  add column if not exists venue_suburb text,
  add column if not exists venue_state text,
  add column if not exists venue_postcode text,
  add column if not exists venue_travel_distance_km numeric(7, 2),
  add column if not exists venue_travel_duration_minutes int;

-- ============================================================================
-- QUOTES: Delivery & Travel logistics (North Queensland)
-- ============================================================================
alter table quotes
  add column if not exists delivery_region text,
  add column if not exists delivery_date date,
  add column if not exists required_arrival_time time,
  add column if not exists delivery_window_start time,
  add column if not exists delivery_window_end time,
  add column if not exists return_travel_duration_minutes int,
  add column if not exists vehicle_count int,
  add column if not exists vehicle_type text,
  add column if not exists driver_required boolean not null default false,
  add column if not exists fuel_travel_charge_cents bigint,
  add column if not exists accommodation_required boolean not null default false,
  add column if not exists overnight_travel_required boolean not null default false,
  add column if not exists ferry_toll_parking_cost_cents bigint,
  add column if not exists regional_surcharge_cents bigint,
  add column if not exists staff_travel_time_minutes int,
  add column if not exists delivery_notes text;

-- ============================================================================
-- QUOTES: Enquiry / BDM tracking
-- ============================================================================
alter table quotes
  add column if not exists enquiry_source text,
  add column if not exists assigned_staff_id uuid references staff_members (id),
  add column if not exists quote_due_date date,
  add column if not exists last_client_contact_date date,
  add column if not exists next_action text,
  add column if not exists estimated_event_value_cents bigint,
  add column if not exists confirmation_probability int
    constraint chk_confirmation_probability check (
      confirmation_probability is null or confirmation_probability between 0 and 100
    );

-- ============================================================================
-- QUOTES: Confirmed-stage checklist
-- ============================================================================
alter table quotes
  add column if not exists confirmed_at date,
  add column if not exists deposit_due_date date,
  add column if not exists deposit_received_at date,
  add column if not exists contract_accepted_at date,
  add column if not exists final_guest_count_due_date date,
  add column if not exists final_payment_due_date date;

-- ============================================================================
-- QUOTES: Lost (rejected) tracking
-- ============================================================================
alter table quotes
  add column if not exists lost_reason text;

-- ============================================================================
-- QUOTES: Cancelled tracking
-- ============================================================================
alter table quotes
  add column if not exists cancelled_at date,
  add column if not exists cancelled_by text,
  add column if not exists cancellation_reason text,
  add column if not exists cancellation_fee_charged_cents bigint,
  add column if not exists deposit_retained_or_refunded text,
  add column if not exists refund_amount_cents bigint;

create index if not exists idx_quotes_assigned_staff on quotes (assigned_staff_id);
create index if not exists idx_quotes_delivery_region on quotes (delivery_region);
