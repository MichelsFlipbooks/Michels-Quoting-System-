import type {
  DepositRetentionOption,
  GstStatus,
  LineItemSection,
  MoneyAdjustmentType,
  QuoteStatus,
  AuditAction,
} from "./constants";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "staff";
  created_at: string;
}

export interface Client {
  id: string;
  contact_name: string;
  organisation: string | null;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  delivery_address: string | null;
  notes: string | null;
  preferences: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DietaryRequirement {
  id: string;
  name: string;
  active: boolean;
}

export type CatalogueCategory = LineItemSection;

export interface CatalogueItem {
  id: string;
  category: CatalogueCategory;
  name: string;
  description: string | null;
  internal_description: string | null;
  default_unit: string;
  default_unit_price_cents: number;
  default_internal_cost_cents: number;
  default_gst_status: GstStatus;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CateringPackage {
  id: string;
  name: string;
  description: string | null;
  pricing_type: "per_guest" | "fixed";
  price_per_guest_cents: number | null;
  fixed_price_cents: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackageMenuSelection {
  id: string;
  package_id: string;
  catalogue_item_id: string | null;
  custom_name: string | null;
  is_optional_addon: boolean;
  addon_price_cents: number | null;
  sort_order: number;
}

export interface StaffMember {
  id: string;
  full_name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
}

export interface Quote {
  id: string;
  quote_number: string;
  client_id: string;

  status: QuoteStatus;
  status_reason: string | null;
  next_follow_up_date: string | null;

  event_name: string | null;
  event_type: string | null;
  service_level: string | null;
  event_date: string | null;
  start_time: string | null;
  finish_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  guest_numbers: number | null;
  event_contact_name: string | null;
  event_contact_phone: string | null;
  event_contact_email: string | null;
  event_contact_role: string | null;
  event_contact_same_as_client: boolean;
  access_notes: string | null;
  parking_loading_details: string | null;
  kitchen_facilities: string | null;
  client_budget_cents: number | null;
  internal_notes: string | null;
  client_notes: string | null;

  discount_type: MoneyAdjustmentType | null;
  discount_value: number;
  deposit_type: MoneyAdjustmentType;
  deposit_value: number;

  quote_date: string;
  expiry_date: string | null;
  current_version_number: number;

  // Venue / Google Maps
  venue_place_id: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  venue_street_address: string | null;
  venue_suburb: string | null;
  venue_state: string | null;
  venue_postcode: string | null;
  venue_travel_distance_km: number | null;
  venue_travel_duration_minutes: number | null;

  // Delivery & Travel logistics
  delivery_region: string | null;
  delivery_date: string | null;
  required_arrival_time: string | null;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  return_travel_duration_minutes: number | null;
  vehicle_count: number | null;
  vehicle_type: string | null;
  driver_required: boolean;
  fuel_travel_charge_cents: number | null;
  accommodation_required: boolean;
  overnight_travel_required: boolean;
  ferry_toll_parking_cost_cents: number | null;
  regional_surcharge_cents: number | null;
  staff_travel_time_minutes: number | null;
  delivery_notes: string | null;

  // Enquiry / BDM tracking
  enquiry_source: string | null;
  assigned_staff_id: string | null;
  quote_due_date: string | null;
  last_client_contact_date: string | null;
  next_action: string | null;
  estimated_event_value_cents: number | null;
  confirmation_probability: number | null;

  // Confirmed-stage checklist
  confirmed_at: string | null;
  deposit_due_date: string | null;
  deposit_received_at: string | null;
  contract_accepted_at: string | null;
  final_guest_count_due_date: string | null;
  final_payment_due_date: string | null;

  // Lost tracking
  lost_reason: string | null;

  // Cancelled tracking
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  cancellation_fee_charged_cents: number | null;
  deposit_retained_or_refunded: DepositRetentionOption | null;
  refund_amount_cents: number | null;

  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteLineItem {
  id: string;
  quote_id: string;
  section: LineItemSection;
  line_type: "package" | "catalogue_item" | "custom";
  catalogue_item_id: string | null;
  package_id: string | null;
  parent_line_item_id: string | null;

  description: string;
  internal_description: string | null;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  hours: number | null;
  gst_status: GstStatus;
  internal_cost_cents: number;

  is_included_selection: boolean;
  is_addon: boolean;
  sort_order: number;

  created_at: string;
  updated_at: string;
}

export interface QuoteDietaryRequirement {
  id: string;
  quote_id: string;
  dietary_requirement_id: string;
  guest_count: number | null;
  notes: string | null;
}

export interface QuoteVersion {
  id: string;
  quote_id: string;
  version_number: number;
  created_by: string | null;
  created_at: string;
  reason_for_revision: string | null;
  previous_total_cents: number | null;
  new_total_cents: number;
  snapshot_data: QuoteSnapshot;
  pdf_url: string | null;
}

export interface EventTimelineItem {
  id: string;
  quote_id: string;
  time: string | null;
  description: string;
  sort_order: number;
}

export interface AuditLog {
  id: string;
  quote_id: string | null;
  user_id: string | null;
  action: AuditAction;
  details: Record<string, unknown> | null;
  created_at: string;
}

/** Self-contained snapshot stored on a quote_versions row when a quote is issued. */
export interface QuoteSnapshot {
  quote: Quote;
  client: Client;
  lineItems: QuoteLineItem[];
  totals: import("./calculations").QuoteTotals;
  generatedAt: string;
}
