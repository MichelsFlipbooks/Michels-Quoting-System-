-- Quote builder restructure: merged Customer & Event Details page, merged
-- Food and Beverage page (with beverage packages), and conditional Delivery
-- fields replacing the old Delivery & Travel tab.
-- Purely additive — no columns dropped or renamed. Safe to re-run.

-- ============================================================================
-- QUOTES: Corporate event-type fields + conditional Delivery fields
-- ============================================================================
alter table quotes
  add column if not exists business_name text,
  add column if not exists business_address text,
  add column if not exists delivery_address text,
  add column if not exists delivery_time time,
  add column if not exists delivery_contact text,
  add column if not exists kitchen_departure_time time;

-- ============================================================================
-- CATERING PACKAGES: distinguish food packages from beverage packages so the
-- same package-picker mechanic can power both "Catering Packages" and
-- "Beverage Packages" on the merged Food and Beverage page.
-- Reuses the existing catalogue_category enum (food/beverage/staffing/
-- equipment/delivery_travel/additional_charge) — the app will only ever write
-- 'food' or 'beverage' here. Existing rows default to 'food', which matches
-- every package created so far.
-- ============================================================================
alter table catering_packages
  add column if not exists category catalogue_category not null default 'food';
