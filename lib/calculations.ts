import { GST_RATE, type LineItemSection } from "./constants";

/**
 * All money in this module is handled in integer cents to avoid floating
 * point rounding drift. The only place fractional cents can appear is the
 * intermediate multiplication steps below, and every one of them is closed
 * out with `roundCents` before being used again.
 */
export function roundCents(value: number): number {
  return Math.round(value);
}

export interface CalcLineItem {
  section: LineItemSection;
  quantity: number;
  unit_price_cents: number;
  hours: number | null;
  gst_status: "gst_applicable" | "gst_free";
  internal_cost_cents: number;
}

/** A staffing line's total is quantity (staff count) x hours x hourly rate. */
export function lineItemTotalCents(item: Pick<CalcLineItem, "quantity" | "unit_price_cents" | "hours">): number {
  const multiplier = item.hours != null ? item.quantity * item.hours : item.quantity;
  return roundCents(multiplier * item.unit_price_cents);
}

export function lineItemInternalCostCents(
  item: Pick<CalcLineItem, "quantity" | "internal_cost_cents" | "hours">,
): number {
  const multiplier = item.hours != null ? item.quantity * item.hours : item.quantity;
  return roundCents(multiplier * item.internal_cost_cents);
}

export function sectionSubtotalCents(lineItems: CalcLineItem[], section: LineItemSection): number {
  return lineItems
    .filter((item) => item.section === section)
    .reduce((sum, item) => sum + lineItemTotalCents(item), 0);
}

export interface QuoteCalcInput {
  lineItems: CalcLineItem[];
  discountType: "percentage" | "fixed" | null;
  discountValue: number; // percentage points (e.g. 10 = 10%) or dollars (e.g. 50 = $50) depending on discountType
  depositType: "percentage" | "fixed";
  depositValue: number;
  guestNumbers: number | null;
}

export interface QuoteTotals {
  foodSubtotalCents: number;
  beverageSubtotalCents: number;
  staffingSubtotalCents: number;
  equipmentSubtotalCents: number;
  deliveryTravelSubtotalCents: number;
  additionalChargeSubtotalCents: number;
  internalCostTotalCents: number;
  rawSubtotalCents: number;
  discountCents: number;
  subtotalExGstCents: number;
  gstCents: number;
  totalIncGstCents: number;
  depositCents: number;
  balanceDueCents: number;
  perGuestCents: number;
}

export function computeQuoteTotals(input: QuoteCalcInput): QuoteTotals {
  const { lineItems, discountType, discountValue, depositType, depositValue, guestNumbers } = input;

  const foodSubtotalCents = sectionSubtotalCents(lineItems, "food");
  const beverageSubtotalCents = sectionSubtotalCents(lineItems, "beverage");
  const staffingSubtotalCents = sectionSubtotalCents(lineItems, "staffing");
  const equipmentSubtotalCents = sectionSubtotalCents(lineItems, "equipment");
  const deliveryTravelSubtotalCents = sectionSubtotalCents(lineItems, "delivery_travel");
  const additionalChargeSubtotalCents = sectionSubtotalCents(lineItems, "additional_charge");

  const internalCostTotalCents = lineItems.reduce(
    (sum, item) => sum + lineItemInternalCostCents(item),
    0,
  );

  const rawSubtotalCents =
    foodSubtotalCents +
    beverageSubtotalCents +
    staffingSubtotalCents +
    equipmentSubtotalCents +
    deliveryTravelSubtotalCents +
    additionalChargeSubtotalCents;

  const rawGstApplicableCents = lineItems
    .filter((item) => item.gst_status === "gst_applicable")
    .reduce((sum, item) => sum + lineItemTotalCents(item), 0);

  let discountCents = 0;
  if (discountType === "percentage" && discountValue > 0) {
    discountCents = roundCents(rawSubtotalCents * (discountValue / 100));
  } else if (discountType === "fixed" && discountValue > 0) {
    discountCents = roundCents(discountValue * 100);
  }
  // Never let a discount take the subtotal negative.
  discountCents = Math.min(discountCents, rawSubtotalCents);

  const subtotalExGstCents = rawSubtotalCents - discountCents;

  // Discount is applied pro-rata across GST-applicable and GST-free lines,
  // based on their share of the pre-discount subtotal.
  const gstApplicableRatio = rawSubtotalCents > 0 ? rawGstApplicableCents / rawSubtotalCents : 0;
  const gstCents = roundCents(subtotalExGstCents * gstApplicableRatio * GST_RATE);

  const totalIncGstCents = subtotalExGstCents + gstCents;

  const depositCents =
    depositType === "percentage"
      ? roundCents(totalIncGstCents * (depositValue / 100))
      : roundCents(depositValue * 100);

  const balanceDueCents = totalIncGstCents - depositCents;

  const perGuestCents =
    guestNumbers && guestNumbers > 0 ? roundCents(totalIncGstCents / guestNumbers) : 0;

  return {
    foodSubtotalCents,
    beverageSubtotalCents,
    staffingSubtotalCents,
    equipmentSubtotalCents,
    deliveryTravelSubtotalCents,
    additionalChargeSubtotalCents,
    internalCostTotalCents,
    rawSubtotalCents,
    discountCents,
    subtotalExGstCents,
    gstCents,
    totalIncGstCents,
    depositCents,
    balanceDueCents,
    perGuestCents,
  };
}
