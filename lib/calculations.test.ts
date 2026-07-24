import { describe, expect, it } from "vitest";
import {
  computeQuoteTotals,
  lineItemInternalCostCents,
  lineItemTotalCents,
  sectionSubtotalCents,
  type CalcLineItem,
} from "./calculations";

function food(quantity: number, unitPriceCents: number, gst: "gst_applicable" | "gst_free" = "gst_applicable"): CalcLineItem {
  return {
    section: "food",
    quantity,
    unit_price_cents: unitPriceCents,
    hours: null,
    gst_status: gst,
    internal_cost_cents: 0,
  };
}

function staffing(staffCount: number, hours: number, hourlyRateCents: number, internalCostCents = 0): CalcLineItem {
  return {
    section: "staffing",
    quantity: staffCount,
    unit_price_cents: hourlyRateCents,
    hours,
    gst_status: "gst_applicable",
    internal_cost_cents: internalCostCents,
  };
}

describe("lineItemTotalCents", () => {
  it("multiplies quantity by unit price for simple lines", () => {
    expect(lineItemTotalCents({ quantity: 100, unit_price_cents: 2750, hours: null })).toBe(275000);
  });

  it("multiplies quantity x hours x rate for staffing lines", () => {
    // 3 waitstaff, 5 hours, $45.00/hr => 3 x 5 x 4500 = 67500 cents
    expect(lineItemTotalCents({ quantity: 3, unit_price_cents: 4500, hours: 5 })).toBe(67500);
  });

  it("rounds fractional cents to the nearest cent", () => {
    // 1.5kg at $3.33/kg (333 cents) = 499.5 cents -> rounds to 500
    expect(lineItemTotalCents({ quantity: 1.5, unit_price_cents: 333, hours: null })).toBe(500);
  });

  it("treats zero-price included package selections as zero total", () => {
    expect(lineItemTotalCents({ quantity: 100, unit_price_cents: 0, hours: null })).toBe(0);
  });
});

describe("lineItemInternalCostCents", () => {
  it("computes internal cost using the same quantity/hours multiplier as the client total", () => {
    expect(lineItemInternalCostCents({ quantity: 3, internal_cost_cents: 3200, hours: 5 })).toBe(48000);
  });
});

describe("sectionSubtotalCents", () => {
  it("only sums line items belonging to the requested section", () => {
    const items: CalcLineItem[] = [food(100, 2750), staffing(2, 4, 4500)];
    expect(sectionSubtotalCents(items, "food")).toBe(275000);
    expect(sectionSubtotalCents(items, "staffing")).toBe(36000);
    expect(sectionSubtotalCents(items, "equipment")).toBe(0);
  });
});

describe("computeQuoteTotals", () => {
  it("computes the full pipeline for a simple GST-applicable quote with no discount", () => {
    // 50 guests x Classic Canape Package @ $27.50 = $1375.00 ex GST
    const totals = computeQuoteTotals({
      lineItems: [food(50, 2750)],
      discountType: null,
      discountValue: 0,
      depositType: "percentage",
      depositValue: 20,
      guestNumbers: 50,
    });

    expect(totals.foodSubtotalCents).toBe(137500);
    expect(totals.rawSubtotalCents).toBe(137500);
    expect(totals.discountCents).toBe(0);
    expect(totals.subtotalExGstCents).toBe(137500);
    expect(totals.gstCents).toBe(13750); // 10% of 1375.00
    expect(totals.totalIncGstCents).toBe(151250);
    expect(totals.depositCents).toBe(30250); // 20% of total inc GST
    expect(totals.balanceDueCents).toBe(121000);
    expect(totals.perGuestCents).toBe(3025); // 1512.50 / 50 = 30.25
  });

  it("applies a percentage discount pro-rata before calculating GST", () => {
    const totals = computeQuoteTotals({
      lineItems: [food(100, 1000)], // $1000.00 ex GST, fully GST-applicable
      discountType: "percentage",
      discountValue: 10,
      depositType: "percentage",
      depositValue: 20,
      guestNumbers: 100,
    });

    expect(totals.rawSubtotalCents).toBe(100000);
    expect(totals.discountCents).toBe(10000); // 10% of 1000
    expect(totals.subtotalExGstCents).toBe(90000);
    expect(totals.gstCents).toBe(9000); // 10% of 900 (fully GST-applicable)
    expect(totals.totalIncGstCents).toBe(99000);
  });

  it("prorates a discount across mixed GST-applicable and GST-free lines", () => {
    const totals = computeQuoteTotals({
      lineItems: [
        food(1, 80000, "gst_applicable"), // $800 GST-applicable
        food(1, 20000, "gst_free"), // $200 GST-free
      ],
      discountType: "fixed",
      discountValue: 100, // $100 discount
      depositType: "percentage",
      depositValue: 20,
      guestNumbers: null,
    });

    expect(totals.rawSubtotalCents).toBe(100000);
    expect(totals.discountCents).toBe(10000);
    expect(totals.subtotalExGstCents).toBe(90000);
    // 80% of the pre-discount subtotal was GST-applicable, so 80% of the
    // discounted subtotal (72000c) is taxable at 10% = 7200c.
    expect(totals.gstCents).toBe(7200);
    expect(totals.totalIncGstCents).toBe(97200);
  });

  it("never lets a discount exceed the raw subtotal", () => {
    const totals = computeQuoteTotals({
      lineItems: [food(1, 5000)],
      discountType: "fixed",
      discountValue: 1000, // way more than the $50 subtotal
      depositType: "percentage",
      depositValue: 20,
      guestNumbers: null,
    });

    expect(totals.discountCents).toBe(5000);
    expect(totals.subtotalExGstCents).toBe(0);
    expect(totals.gstCents).toBe(0);
    expect(totals.totalIncGstCents).toBe(0);
  });

  it("supports a fixed-dollar deposit instead of a percentage", () => {
    const totals = computeQuoteTotals({
      lineItems: [food(1, 100000)],
      discountType: null,
      discountValue: 0,
      depositType: "fixed",
      depositValue: 500, // $500 flat deposit
      guestNumbers: null,
    });

    expect(totals.depositCents).toBe(50000);
    expect(totals.balanceDueCents).toBe(totals.totalIncGstCents - 50000);
  });

  it("returns zero per-guest value when guest numbers are missing or zero", () => {
    const totals = computeQuoteTotals({
      lineItems: [food(1, 10000)],
      discountType: null,
      discountValue: 0,
      depositType: "percentage",
      depositValue: 20,
      guestNumbers: 0,
    });
    expect(totals.perGuestCents).toBe(0);

    const totalsNull = computeQuoteTotals({
      lineItems: [food(1, 10000)],
      discountType: null,
      discountValue: 0,
      depositType: "percentage",
      depositValue: 20,
      guestNumbers: null,
    });
    expect(totalsNull.perGuestCents).toBe(0);
  });

  it("sums subtotals independently across all six sections plus staffing hours math", () => {
    const totals = computeQuoteTotals({
      lineItems: [
        food(100, 2750), // 275000
        { section: "beverage", quantity: 50, unit_price_cents: 3500, hours: null, gst_status: "gst_applicable", internal_cost_cents: 1800 }, // 175000
        staffing(4, 5, 4500), // 90000
        { section: "equipment", quantity: 10, unit_price_cents: 800, hours: null, gst_status: "gst_applicable", internal_cost_cents: 350 }, // 8000
        { section: "delivery_travel", quantity: 1, unit_price_cents: 15000, hours: null, gst_status: "gst_applicable", internal_cost_cents: 6000 }, // 15000
        { section: "additional_charge", quantity: 1, unit_price_cents: 5000, hours: null, gst_status: "gst_applicable", internal_cost_cents: 2000 }, // 5000
      ],
      discountType: null,
      discountValue: 0,
      depositType: "percentage",
      depositValue: 20,
      guestNumbers: 100,
    });

    expect(totals.foodSubtotalCents).toBe(275000);
    expect(totals.beverageSubtotalCents).toBe(175000);
    expect(totals.staffingSubtotalCents).toBe(90000);
    expect(totals.equipmentSubtotalCents).toBe(8000);
    expect(totals.deliveryTravelSubtotalCents).toBe(15000);
    expect(totals.additionalChargeSubtotalCents).toBe(5000);
    expect(totals.rawSubtotalCents).toBe(275000 + 175000 + 90000 + 8000 + 15000 + 5000);
  });
});
