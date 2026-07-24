export const EVENT_TYPES = [
  "Wedding",
  "Corporate Event",
  "Private Party",
  "Cocktail Function",
  "Gala / Fundraiser",
  "Christmas Party",
  "Birthday",
  "Funeral / Wake",
  "Other",
] as const;

export const SERVICE_LEVELS = [
  "Drop-off",
  "Self-Service Buffet",
  "Served Buffet",
  "Plated / Sit-Down",
  "Canape / Cocktail",
  "Full-Service Staffed",
] as const;

export const QUOTE_STATUSES = [
  "enquiry",
  "quote_in_progress",
  "quote_sent",
  "follow_up_due",
  "confirmed",
  "completed",
  "rejected",
  "cancelled",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  enquiry: "Enquiry",
  quote_in_progress: "Quote in Progress",
  quote_sent: "Quote Sent",
  follow_up_due: "Follow-Up Due",
  confirmed: "Confirmed",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/** Statuses shown on the main dashboard's "Active Quotes" list. */
export const ACTIVE_QUOTE_STATUSES: QuoteStatus[] = [
  "enquiry",
  "quote_in_progress",
  "quote_sent",
  "follow_up_due",
];

/** Statuses shown in "Confirmed Events". */
export const CONFIRMED_EVENT_STATUSES: QuoteStatus[] = ["confirmed", "completed"];

/** Statuses that move a quote to the Archive and out of the main dashboard. */
export const ARCHIVE_STATUSES: QuoteStatus[] = ["rejected", "cancelled"];

/** Statuses that require a reason to be recorded. */
export const STATUSES_REQUIRING_REASON: QuoteStatus[] = ["rejected", "cancelled"];

export const LINE_ITEM_SECTIONS = [
  "food",
  "beverage",
  "staffing",
  "equipment",
  "delivery_travel",
  "additional_charge",
] as const;

export type LineItemSection = (typeof LINE_ITEM_SECTIONS)[number];

export const LINE_ITEM_SECTION_LABELS: Record<LineItemSection, string> = {
  food: "Food & Menu",
  beverage: "Beverages",
  staffing: "Staffing",
  equipment: "Equipment",
  delivery_travel: "Delivery & Travel",
  additional_charge: "Additional Charges",
};

export const GST_STATUSES = ["gst_applicable", "gst_free"] as const;
export type GstStatus = (typeof GST_STATUSES)[number];

export const GST_STATUS_LABELS: Record<GstStatus, string> = {
  gst_applicable: "GST Applicable",
  gst_free: "GST Free",
};

export const MONEY_ADJUSTMENT_TYPES = ["percentage", "fixed"] as const;
export type MoneyAdjustmentType = (typeof MONEY_ADJUSTMENT_TYPES)[number];

export const UNIT_SUGGESTIONS = [
  "each",
  "hour",
  "platter",
  "bottle",
  "per guest",
  "dozen",
  "kg",
  "litre",
  "day",
] as const;

export const GST_RATE = 0.1;

export const CLIENT_STAFFING_NOTE =
  "Staffing is based on guest numbers and service style to ensure a smooth and " +
  "professional event. Final staffing will be confirmed to suit your event requirements.";

export const AUDIT_ACTIONS = [
  "quote_created",
  "quote_changed",
  "quote_sent",
  "status_changed",
  "quote_confirmed",
  "quote_rejected",
  "quote_cancelled",
  "price_overridden",
  "discount_applied",
  "pdf_generated",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
