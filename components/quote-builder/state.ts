import type { GstStatus, LineItemSection, MoneyAdjustmentType, QuoteStatus } from "@/lib/constants";
import type { Client, EventTimelineItem, Quote, QuoteDietaryRequirement, QuoteLineItem } from "@/lib/types";

export interface DraftLineItem {
  localId: string;
  section: LineItemSection;
  line_type: "package" | "catalogue_item" | "custom";
  catalogue_item_id: string | null;
  package_id: string | null;
  description: string;
  internal_description: string;
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

export interface DraftDietary {
  dietaryRequirementId: string;
  guestCount: number | null;
  notes: string;
}

export interface DraftTimelineItem {
  localId: string;
  time: string;
  description: string;
  sort_order: number;
}

export interface QuoteDraft {
  id: string | null;
  quoteNumber: string | null;
  status: QuoteStatus;
  statusReason: string | null;
  currentVersionNumber: number;

  /** id === "" means this client hasn't been saved to the database yet. */
  client: Client;

  eventName: string;
  eventType: string;
  serviceLevel: string;
  eventDate: string;
  startTime: string;
  finishTime: string;
  venueName: string;
  venueAddress: string;
  guestNumbers: number | null;
  eventContactName: string;
  eventContactPhone: string;
  accessNotes: string;
  parkingLoadingDetails: string;
  kitchenFacilities: string;
  clientBudgetCents: number | null;
  internalNotes: string;
  clientNotes: string;

  discountType: MoneyAdjustmentType | null;
  discountValue: number;
  depositType: MoneyAdjustmentType;
  depositValue: number;
  quoteDate: string;
  expiryDate: string;
  nextFollowUpDate: string;

  lineItems: DraftLineItem[];
  dietaryRequirements: DraftDietary[];
  timelineItems: DraftTimelineItem[];
}

function makeLocalId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36);
}

export function newLineItem(partial: Partial<DraftLineItem> & { section: LineItemSection }): DraftLineItem {
  return {
    localId: makeLocalId(),
    line_type: "custom",
    catalogue_item_id: null,
    package_id: null,
    description: "",
    internal_description: "",
    quantity: 1,
    unit: "each",
    unit_price_cents: 0,
    hours: null,
    gst_status: "gst_applicable",
    internal_cost_cents: 0,
    is_included_selection: false,
    is_addon: false,
    sort_order: 0,
    ...partial,
  };
}

export function blankClient(): Client {
  return {
    id: "",
    contact_name: "",
    organisation: "",
    email: "",
    phone: "",
    billing_address: "",
    delivery_address: "",
    notes: "",
    preferences: "",
    created_by: null,
    created_at: "",
    updated_at: "",
  };
}

function todayISO(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

export function createEmptyDraft(initialClient: Client | null): QuoteDraft {
  return {
    id: null,
    quoteNumber: null,
    status: "enquiry",
    statusReason: null,
    currentVersionNumber: 0,
    client: initialClient ?? blankClient(),
    eventName: "",
    eventType: "",
    serviceLevel: "",
    eventDate: "",
    startTime: "",
    finishTime: "",
    venueName: "",
    venueAddress: "",
    guestNumbers: null,
    eventContactName: "",
    eventContactPhone: "",
    accessNotes: "",
    parkingLoadingDetails: "",
    kitchenFacilities: "",
    clientBudgetCents: null,
    internalNotes: "",
    clientNotes: "",
    discountType: null,
    discountValue: 0,
    depositType: "percentage",
    depositValue: 20,
    quoteDate: todayISO(),
    expiryDate: "",
    nextFollowUpDate: "",
    lineItems: [],
    dietaryRequirements: [],
    timelineItems: [],
  };
}

export function draftFromExisting(
  quote: Quote,
  client: Client,
  lineItems: QuoteLineItem[],
  dietary: QuoteDietaryRequirement[],
  timeline: EventTimelineItem[] = [],
): QuoteDraft {
  return {
    id: quote.id,
    quoteNumber: quote.quote_number,
    status: quote.status,
    statusReason: quote.status_reason,
    currentVersionNumber: quote.current_version_number,
    client,
    eventName: quote.event_name ?? "",
    eventType: quote.event_type ?? "",
    serviceLevel: quote.service_level ?? "",
    eventDate: quote.event_date ?? "",
    startTime: quote.start_time ?? "",
    finishTime: quote.finish_time ?? "",
    venueName: quote.venue_name ?? "",
    venueAddress: quote.venue_address ?? "",
    guestNumbers: quote.guest_numbers,
    eventContactName: quote.event_contact_name ?? "",
    eventContactPhone: quote.event_contact_phone ?? "",
    accessNotes: quote.access_notes ?? "",
    parkingLoadingDetails: quote.parking_loading_details ?? "",
    kitchenFacilities: quote.kitchen_facilities ?? "",
    clientBudgetCents: quote.client_budget_cents,
    internalNotes: quote.internal_notes ?? "",
    clientNotes: quote.client_notes ?? "",
    discountType: quote.discount_type,
    discountValue: quote.discount_value,
    depositType: quote.deposit_type,
    depositValue: quote.deposit_value,
    quoteDate: quote.quote_date,
    expiryDate: quote.expiry_date ?? "",
    nextFollowUpDate: quote.next_follow_up_date ?? "",
    lineItems: lineItems
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((li) => ({
        localId: li.id,
        section: li.section,
        line_type: li.line_type,
        catalogue_item_id: li.catalogue_item_id,
        package_id: li.package_id,
        description: li.description,
        internal_description: li.internal_description ?? "",
        quantity: li.quantity,
        unit: li.unit,
        unit_price_cents: li.unit_price_cents,
        hours: li.hours,
        gst_status: li.gst_status,
        internal_cost_cents: li.internal_cost_cents,
        is_included_selection: li.is_included_selection,
        is_addon: li.is_addon,
        sort_order: li.sort_order,
      })),
    dietaryRequirements: dietary.map((d) => ({
      dietaryRequirementId: d.dietary_requirement_id,
      guestCount: d.guest_count,
      notes: d.notes ?? "",
    })),
    timelineItems: timeline
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => ({
        localId: t.id,
        time: t.time ?? "",
        description: t.description,
        sort_order: t.sort_order,
      })),
  };
}

export function newTimelineItem(sortOrder: number): DraftTimelineItem {
  return { localId: makeLocalId(), time: "", description: "", sort_order: sortOrder };
}
