-- Michels Quoting System — Phase 1 seed data
-- Run AFTER 0001_init.sql. This is placeholder/example data so the quote
-- builder has something to select from on day one — replace with Michels'
-- real menu, pricing, and packages via the Supabase Studio table editor
-- (Table Editor > catalogue_items / catering_packages / package_menu_selections).

-- ============================================================================
-- DIETARY REQUIREMENTS
-- ============================================================================
insert into dietary_requirements (name) values
  ('Gluten Free'),
  ('Vegan'),
  ('Vegetarian'),
  ('Dairy Free'),
  ('Nut Allergy'),
  ('Shellfish Allergy'),
  ('Halal'),
  ('Kosher')
on conflict (name) do nothing;

-- ============================================================================
-- CATALOGUE ITEMS — FOOD (canapé examples used to build the sample package)
-- ============================================================================
insert into catalogue_items (category, name, description, internal_description, default_unit, default_unit_price_cents, default_internal_cost_cents, default_gst_status)
values
  ('food', 'Smoked Salmon Blini', 'Smoked salmon, dill creme fraiche, blini', 'Blini base par-cooked; salmon sliced 5mm; assemble on tray, chill 2C', 'each', 550, 220, 'gst_applicable'),
  ('food', 'Pumpkin & Goat Cheese Tart', 'Roast pumpkin and goat cheese tartlet', 'Tartlet shells blind-baked; filling batch-prepped; reheat 160C 6 min', 'each', 500, 190, 'gst_applicable'),
  ('food', 'French Onion Tart', 'Caramelised onion and gruyere tart', 'Onions caramelised previous day; assemble and bake to order', 'each', 500, 180, 'gst_applicable'),
  ('food', 'Crispy Chicken Canape', 'Crumbed chicken, chilli mayo', 'Fry to order, 175C 4 min, drain, sauce on top', 'each', 550, 210, 'gst_applicable'),
  ('food', 'Beef Crostini', 'Slow-cooked beef, horseradish cream, crostini', 'Beef braised prior day, sliced thin, assemble cold', 'each', 600, 240, 'gst_applicable'),
  ('food', 'Seasonal Fruit Platter', 'Chef-selected seasonal fruit display', 'Platter for 10 guests; confirm seasonal availability with supplier', 'platter', 6500, 3200, 'gst_applicable')
on conflict do nothing;

-- ============================================================================
-- CATALOGUE ITEMS — BEVERAGE
-- ============================================================================
insert into catalogue_items (category, name, description, internal_description, default_unit, default_unit_price_cents, default_internal_cost_cents, default_gst_status)
values
  ('beverage', 'House Sparkling', 'NV sparkling wine, house selection', 'Order from usual beverage supplier, chill 24hr prior', 'bottle', 3500, 1800, 'gst_applicable'),
  ('beverage', 'House White', 'Sauvignon blanc, house selection', 'Chill 24hr prior', 'bottle', 3500, 1800, 'gst_applicable'),
  ('beverage', 'House Red', 'Shiraz/cabernet, house selection', 'Room temp, no chilling needed', 'bottle', 3500, 1800, 'gst_applicable'),
  ('beverage', 'Local Craft Beer', 'Selection of local craft beers', 'Chill 24hr prior', 'each', 900, 500, 'gst_applicable'),
  ('beverage', 'Soft Drinks & Juice', 'Assorted soft drinks and juices', 'Chill 24hr prior', 'each', 500, 250, 'gst_applicable'),
  ('beverage', 'Barista Coffee Service', 'On-site barista with machine and cups', 'Requires power access, confirm with venue', 'per guest', 800, 400, 'gst_applicable')
on conflict do nothing;

-- ============================================================================
-- CATALOGUE ITEMS — STAFFING (used by the auto-recommendation engine)
-- ============================================================================
insert into catalogue_items (category, name, description, internal_description, default_unit, default_unit_price_cents, default_internal_cost_cents, default_gst_status)
values
  ('staffing', 'Head Chef', 'Head chef supervising kitchen and service', 'Confirm menu with head chef 1 week prior', 'hour', 6500, 4500, 'gst_applicable'),
  ('staffing', 'Chef', 'Chef supporting food preparation and service', null, 'hour', 5500, 3800, 'gst_applicable'),
  ('staffing', 'Waitstaff', 'Front of house service staff', null, 'hour', 4500, 3200, 'gst_applicable'),
  ('staffing', 'Bartender', 'Bar service staff', 'Requires RSA certification', 'hour', 4800, 3400, 'gst_applicable'),
  ('staffing', 'Event Supervisor', 'On-site event lead / point of contact', 'Assign for events over 80 guests or multi-area venues', 'hour', 5800, 4000, 'gst_applicable')
on conflict do nothing;

-- ============================================================================
-- CATALOGUE ITEMS — EQUIPMENT
-- ============================================================================
insert into catalogue_items (category, name, description, internal_description, default_unit, default_unit_price_cents, default_internal_cost_cents, default_gst_status)
values
  ('equipment', 'Round Table (Seats 10)', '1.5m round table with linen', 'Check venue for table stock before hiring', 'each', 3500, 1500, 'gst_applicable'),
  ('equipment', 'Bentwood Chair', 'White bentwood chair', null, 'each', 800, 350, 'gst_applicable'),
  ('equipment', 'Cocktail/Bar Table', 'High bar table with linen', null, 'each', 4000, 1800, 'gst_applicable'),
  ('equipment', 'Portable Bar Station', 'Mobile bar unit for beverage service', 'Requires 2 staff to set up, confirm access/loading', 'each', 15000, 6000, 'gst_applicable'),
  ('equipment', 'Chafing Dish & Burner', 'Buffet-style hot food holding unit', null, 'each', 3500, 1200, 'gst_applicable')
on conflict do nothing;

-- ============================================================================
-- CATALOGUE ITEMS — DELIVERY & TRAVEL
-- ============================================================================
insert into catalogue_items (category, name, description, internal_description, default_unit, default_unit_price_cents, default_internal_cost_cents, default_gst_status)
values
  ('delivery_travel', 'Delivery & Setup (Brisbane Metro)', 'Delivery, setup and pack-down within Brisbane metro', null, 'each', 15000, 6000, 'gst_applicable'),
  ('delivery_travel', 'Delivery & Setup (Outside Metro)', 'Delivery, setup and pack-down outside Brisbane metro', 'Confirm distance and adjust internal cost for fuel/time', 'each', 25000, 10000, 'gst_applicable'),
  ('delivery_travel', 'Staff Travel Allowance', 'Travel allowance for staff to remote venues', null, 'each', 5000, 5000, 'gst_applicable')
on conflict do nothing;

-- ============================================================================
-- CATALOGUE ITEMS — ADDITIONAL CHARGES
-- ============================================================================
insert into catalogue_items (category, name, description, internal_description, default_unit, default_unit_price_cents, default_internal_cost_cents, default_gst_status)
values
  ('additional_charge', 'Public Holiday Surcharge', '15% surcharge applied on public holidays', 'Confirm surcharge % with current policy before applying', 'each', 0, 0, 'gst_applicable'),
  ('additional_charge', 'Late Booking Fee', 'Fee for bookings confirmed within 7 days of event', null, 'each', 15000, 0, 'gst_applicable'),
  ('additional_charge', 'Cake Cutting Service', 'Staff service to cut and plate client-supplied cake', null, 'each', 5000, 2000, 'gst_applicable')
on conflict do nothing;

-- ============================================================================
-- SAMPLE PACKAGE — Classic Canape Package (matches the spec's example)
-- ============================================================================
with pkg as (
  insert into catering_packages (name, description, pricing_type, price_per_guest_cents)
  values (
    'Classic Canape Package',
    'A curated selection of five canapes served to your guests, priced per person.',
    'per_guest',
    2750
  )
  returning id
)
insert into package_menu_selections (package_id, catalogue_item_id, is_optional_addon, sort_order)
select pkg.id, ci.id, false, sel.ordinal
from pkg,
  (values
    ('Smoked Salmon Blini', 1),
    ('Pumpkin & Goat Cheese Tart', 2),
    ('French Onion Tart', 3),
    ('Crispy Chicken Canape', 4),
    ('Beef Crostini', 5)
  ) as sel(name, ordinal)
  join catalogue_items ci on ci.name = sel.name and ci.category = 'food';

-- Optional add-on for the same package: seasonal fruit platter, priced separately.
with pkg as (
  select id from catering_packages where name = 'Classic Canape Package'
)
insert into package_menu_selections (package_id, catalogue_item_id, is_optional_addon, addon_price_cents, sort_order)
select pkg.id, ci.id, true, 6500, 6
from pkg, catalogue_items ci
where ci.name = 'Seasonal Fruit Platter' and ci.category = 'food';
