"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { GstStatus, LineItemSection, MoneyAdjustmentType } from "@/lib/constants";
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
