"use client";

import { Card } from "@/components/ui/Card";
import { computeQuoteTotals } from "@/lib/calculations";
import { formatAUD } from "@/lib/format";
import type { QuoteDraft } from "./state";

const inputClass =
  "w-full rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper";

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${emphasis ? "text-base font-semibold text-navy-dark" : "text-sm text-navy-dark/80"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function SummarySection({
  draft,
  onChange,
}: {
  draft: QuoteDraft;
  onChange: (fields: Partial<QuoteDraft>) => void;
}) {
  const totals = computeQuoteTotals({
    lineItems: draft.lineItems,
    discountType: draft.discountType,
    discountValue: draft.discountValue,
    depositType: draft.depositType,
    depositValue: draft.depositValue,
    guestNumbers: draft.guestNumbers,
  });

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-navy-dark">Summary</h2>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-navy-dark">Discount Type</span>
          <select
            className={inputClass}
            value={draft.discountType ?? ""}
            onChange={(e) =>
              onChange({ discountType: e.target.value ? (e.target.value as "percentage" | "fixed") : null })
            }
          >
            <option value="">No discount</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed ($)</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-navy-dark">
            Discount Value {draft.discountType === "percentage" ? "(%)" : "($)"}
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            disabled={!draft.discountType}
            value={draft.discountValue}
            onChange={(e) => onChange({ discountValue: Number(e.target.value) })}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-navy-dark">Deposit Type</span>
          <select
            className={inputClass}
            value={draft.depositType}
            onChange={(e) => onChange({ depositType: e.target.value as "percentage" | "fixed" })}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed ($)</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-navy-dark">
            Deposit Value {draft.depositType === "percentage" ? "(%)" : "($)"}
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            value={draft.depositValue}
            onChange={(e) => onChange({ depositValue: Number(e.target.value) })}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-navy-dark">Quote Date</span>
          <input
            type="date"
            className={inputClass}
            value={draft.quoteDate}
            onChange={(e) => onChange({ quoteDate: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-navy-dark">Expiry Date</span>
          <input
            type="date"
            className={inputClass}
            value={draft.expiryDate}
            onChange={(e) => onChange({ expiryDate: e.target.value })}
          />
        </label>
      </div>

      <div className="rounded-lg border border-border-soft p-4">
        <Row label="Food Subtotal" value={formatAUD(totals.foodSubtotalCents)} />
        <Row label="Beverage Subtotal" value={formatAUD(totals.beverageSubtotalCents)} />
        <Row label="Staffing Subtotal" value={formatAUD(totals.staffingSubtotalCents)} />
        <Row label="Equipment Subtotal" value={formatAUD(totals.equipmentSubtotalCents)} />
        <Row label="Delivery & Travel Subtotal" value={formatAUD(totals.deliveryTravelSubtotalCents)} />
        <Row label="Additional Charges" value={formatAUD(totals.additionalChargeSubtotalCents)} />
        <hr className="my-2 border-border-soft" />
        {totals.discountCents > 0 && <Row label="Discount" value={`-${formatAUD(totals.discountCents)}`} />}
        <Row label="Subtotal (excl. GST)" value={formatAUD(totals.subtotalExGstCents)} />
        <Row label="GST (10%)" value={formatAUD(totals.gstCents)} />
        <Row label="Total (incl. GST)" value={formatAUD(totals.totalIncGstCents)} emphasis />
        <hr className="my-2 border-border-soft" />
        <Row label="Deposit" value={formatAUD(totals.depositCents)} />
        <Row label="Balance Due" value={formatAUD(totals.balanceDueCents)} />
        <Row label="Per-Guest Value" value={formatAUD(totals.perGuestCents)} />
        <hr className="my-2 border-border-soft" />
        <Row label="Internal Cost Total" value={formatAUD(totals.internalCostTotalCents)} />
        <Row
          label="Estimated Margin"
          value={formatAUD(totals.subtotalExGstCents - totals.internalCostTotalCents)}
        />
      </div>
    </Card>
  );
}
