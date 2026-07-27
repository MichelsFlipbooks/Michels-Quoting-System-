"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { DepositRetentionOption, GstStatus, LineItemSection, MoneyAdjustmentType } from "@/lib/constants";
import type { Quote } from "@/lib/types";

export interface SaveLineItemInput {
  section: LineItemSection;
  line_type: "package" | "catalogue_item" | "custom";
  catalogue_item_id: string | null;
  package_id: string | null;
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
}

export interface SaveDietaryInput {
  dietary_requirement_id: string;
  guest_count: number | null;
  notes: string | null;
}

export interface SaveTimelineInput {
  time: string | null;
  description: string;
  sort_order: number;
}

export interface SaveQuoteInput {
  id: string | null;
  clientId: string;
  eventName: string | null;
  eventType: string | null;
  serviceLevel: string | null;
  eventDate: string | null;
  startTime: string | null;
  finishTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
  guestNumbers: number | null;
  eventContactName: string | null;
  eventContactPhone: string | null;
  eventContactEmail: string | null;
  eventContactRole: string | null;
  eventContactSameAsClient: boolean;
  accessNotes: string | null;
  parkingLoadingDetails: string | null;
  kitchenFacilities: string | null;
  clientBudgetCents: number | null;
  internalNotes: string | null;
  clientNotes: string | null;
  discountType: MoneyAdjustmentType | null;
  discountValue: number;
  depositType: MoneyAdjustmentType;
  depositValue: number;
  quoteDate: string;
  expiryDate: string | null;
  nextFollowUpDate: string | null;

  venuePlaceId: string | null;
  venueLat: number | null;
  venueLng: number | null;
  venueStreetAddress: string | null;
  venueSuburb: string | null;
  venueState: string | null;
  venuePostcode: string | null;
  venueTravelDistanceKm: number | null;
  venueTravelDurationMinutes: number | null;

  deliveryRegion: string | null;
  deliveryDate: string | null;
  requiredArrivalTime: string | null;
  deliveryWindowStart: string | null;
  deliveryWindowEnd: string | null;
  returnTravelDurationMinutes: number | null;
  vehicleCount: number | null;
  vehicleType: string | null;
  driverRequired: boolean;
  fuelTravelChargeCents: number | null;
  accommodationRequired: boolean;
  overnightTravelRequired: boolean;
  ferryTollParkingCostCents: number | null;
  regionalSurchargeCents: number | null;
  staffTravelTimeMinutes: number | null;
  deliveryNotes: string | null;

  enquirySource: string | null;
  assignedStaffId: string | null;
  quoteDueDate: string | null;
  lastClientContactDate: string | null;
  nextAction: string | null;
  estimatedEventValueCents: number | null;
  confirmationProbability: number | null;

  confirmedAt: string | null;
  depositDueDate: string | null;
  depositReceivedAt: string | null;
  contractAcceptedAt: string | null;
  finalGuestCountDueDate: string | null;
  finalPaymentDueDate: string | null;

  lostReason: string | null;

  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  cancellationFeeChargedCents: number | null;
  depositRetainedOrRefunded: DepositRetentionOption | null;
  refundAmountCents: number | null;

  lineItems: SaveLineItemInput[];
  dietaryRequirements: SaveDietaryInput[];
  timelineItems: SaveTimelineInput[];
}

export async function saveQuoteDraft(input: SaveQuoteInput): Promise<{ quote?: Quote; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const quoteFields = {
    client_id: input.clientId,
    event_name: input.eventName,
    event_type: input.eventType,
    service_level: input.serviceLevel,
    event_date: input.eventDate,
    start_time: input.startTime,
    finish_time: input.finishTime,
    venue_name: input.venueName,
    venue_address: input.venueAddress,
    guest_numbers: input.guestNumbers,
    event_contact_name: input.eventContactName,
    event_contact_phone: input.eventContactPhone,
    event_contact_email: input.eventContactEmail,
    event_contact_role: input.eventContactRole,
    event_contact_same_as_client: input.eventContactSameAsClient,
    access_notes: input.accessNotes,
    parking_loading_details: input.parkingLoadingDetails,
    kitchen_facilities: input.kitchenFacilities,
    client_budget_cents: input.clientBudgetCents,
    internal_notes: input.internalNotes,
    client_notes: input.clientNotes,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    deposit_type: input.depositType,
    deposit_value: input.depositValue,
    quote_date: input.quoteDate,
    expiry_date: input.expiryDate,
    next_follow_up_date: input.nextFollowUpDate,

    venue_place_id: input.venuePlaceId,
    venue_lat: input.venueLat,
    venue_lng: input.venueLng,
    venue_street_address: input.venueStreetAddress,
    venue_suburb: input.venueSuburb,
    venue_state: input.venueState,
    venue_postcode: input.venuePostcode,
    venue_travel_distance_km: input.venueTravelDistanceKm,
    venue_travel_duration_minutes: input.venueTravelDurationMinutes,

    delivery_region: input.deliveryRegion,
    delivery_date: input.deliveryDate,
    required_arrival_time: input.requiredArrivalTime,
    delivery_window_start: input.deliveryWindowStart,
    delivery_window_end: input.deliveryWindowEnd,
    return_travel_duration_minutes: input.returnTravelDurationMinutes,
    vehicle_count: input.vehicleCount,
    vehicle_type: input.vehicleType,
    driver_required: input.driverRequired,
    fuel_travel_charge_cents: input.fuelTravelChargeCents,
    accommodation_required: input.accommodationRequired,
    overnight_travel_required: input.overnightTravelRequired,
    ferry_toll_parking_cost_cents: input.ferryTollParkingCostCents,
    regional_surcharge_cents: input.regionalSurchargeCents,
    staff_travel_time_minutes: input.staffTravelTimeMinutes,
    delivery_notes: input.deliveryNotes,

    enquiry_source: input.enquirySource,
    assigned_staff_id: input.assignedStaffId,
    quote_due_date: input.quoteDueDate,
    last_client_contact_date: input.lastClientContactDate,
    next_action: input.nextAction,
    estimated_event_value_cents: input.estimatedEventValueCents,
    confirmation_probability: input.confirmationProbability,

    confirmed_at: input.confirmedAt,
    deposit_due_date: input.depositDueDate,
    deposit_received_at: input.depositReceivedAt,
    contract_accepted_at: input.contractAcceptedAt,
    final_guest_count_due_date: input.finalGuestCountDueDate,
    final_payment_due_date: input.finalPaymentDueDate,

    lost_reason: input.lostReason,

    cancelled_at: input.cancelledAt,
    cancelled_by: input.cancelledBy,
    cancellation_reason: input.cancellationReason,
    cancellation_fee_charged_cents: input.cancellationFeeChargedCents,
    deposit_retained_or_refunded: input.depositRetainedOrRefunded,
    refund_amount_cents: input.refundAmountCents,
  };

  let quote: Quote;

  if (input.id) {
    const { data, error } = await supabase
      .from("quotes")
      .update(quoteFields)
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) return { error: error.message };
    quote = data as Quote;
    await logAudit(supabase, quote.id, user?.id, "quote_changed", {});
  } else {
    const { data, error } = await supabase
      .from("quotes")
      .insert({ ...quoteFields, created_by: user?.id ?? null })
      .select("*")
      .single();
    if (error) return { error: error.message };
    quote = data as Quote;
    await logAudit(supabase, quote.id, user?.id, "quote_created", {});
  }

  // Replace-all is the simplest correct strategy for line items: this is a
  // single-editor internal tool, and the quote builder always submits the
  // full current set (add/edit/delete/reorder all happen client-side first).
  await supabase.from("quote_line_items").delete().eq("quote_id", quote.id);
  if (input.lineItems.length > 0) {
    const { error: lineItemError } = await supabase.from("quote_line_items").insert(
      input.lineItems.map((li) => ({ ...li, quote_id: quote.id })),
    );
    if (lineItemError) return { error: lineItemError.message };
  }

  await supabase.from("quote_dietary_requirements").delete().eq("quote_id", quote.id);
  if (input.dietaryRequirements.length > 0) {
    await supabase.from("quote_dietary_requirements").insert(
      input.dietaryRequirements.map((d) => ({ ...d, quote_id: quote.id })),
    );
  }

  await supabase.from("event_timeline_items").delete().eq("quote_id", quote.id);
  if (input.timelineItems.length > 0) {
    await supabase.from("event_timeline_items").insert(
      input.timelineItems.map((t) => ({ ...t, quote_id: quote.id })),
    );
  }

  revalidatePath(`/quotes/${quote.id}`);
  revalidatePath("/");
  revalidatePath("/archive");

  return { quote };
}
