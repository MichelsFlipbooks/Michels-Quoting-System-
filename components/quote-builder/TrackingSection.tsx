"use client";

import { Card } from "@/components/ui/Card";
import { computeQuoteTotals } from "@/lib/calculations";
import { formatAUD } from "@/lib/format";
import { ENQUIRY_SOURCES } from "@/lib/constants";
import type { StaffMember } from "@/lib/types";
import type { QuoteDraft } from "./state";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-navy-dark">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper";

type Patch = Partial<QuoteDraft>;

export function TrackingSection({
  draft,
  onChange,
  staffMembers,
}: {
  draft: QuoteDraft;
  onChange: (fields: Patch) => void;
  staffMembers: StaffMember[];
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
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-navy-dark">Enquiry Tracking</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Source of Enquiry">
            <select
              className={inputClass}
              value={draft.enquirySource}
              onChange={(e) => onChange({ enquirySource: e.target.value })}
            >
              <option value="">Select…</option>
              {ENQUIRY_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Assigned Team Member">
            <select
              className={inputClass}
              value={draft.assignedStaffId ?? ""}
              onChange={(e) => onChange({ assignedStaffId: e.target.value || null })}
            >
              <option value="">Unassigned</option>
              {staffMembers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                  {s.role_title ? ` (${s.role_title})` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Next Follow-Up Date">
            <input
              type="date"
              className={inputClass}
              value={draft.nextFollowUpDate}
              onChange={(e) => onChange({ nextFollowUpDate: e.target.value })}
            />
          </Field>

          <Field label="Quote Due Date">
            <input
              type="date"
              className={inputClass}
              value={draft.quoteDueDate}
              onChange={(e) => onChange({ quoteDueDate: e.target.value })}
            />
          </Field>

          <Field label="Last Client Contact">
            <input
              type="date"
              className={inputClass}
              value={draft.lastClientContactDate}
              onChange={(e) => onChange({ lastClientContactDate: e.target.value })}
            />
          </Field>

          <Field label="Estimated Event Value (AUD)">
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              value={draft.estimatedEventValueCents != null ? draft.estimatedEventValueCents / 100 : ""}
              onChange={(e) =>
                onChange({
                  estimatedEventValueCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null,
                })
              }
            />
          </Field>

          <Field label="Probability of Confirmation (%)">
            <input
              type="number"
              min={0}
              max={100}
              className={inputClass}
              value={draft.confirmationProbability ?? ""}
              onChange={(e) =>
                onChange({ confirmationProbability: e.target.value ? Number(e.target.value) : null })
              }
            />
          </Field>

          <Field label="Next Action">
            <input
              type="text"
              className={inputClass}
              value={draft.nextAction}
              onChange={(e) => onChange({ nextAction: e.target.value })}
            />
          </Field>
        </div>
      </Card>

      {(draft.status === "confirmed" || draft.status === "completed") && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-navy-dark">Confirmation Checklist</h2>
          <p className="mb-4 text-sm text-navy-dark/60">
            Deposit required: <span className="font-semibold text-navy-dark">{formatAUD(totals.depositCents)}</span>{" "}
            (calculated from the Summary tab — deposit type/value there).
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Confirmation Date">
              <input
                type="date"
                className={inputClass}
                value={draft.confirmedAt}
                onChange={(e) => onChange({ confirmedAt: e.target.value })}
              />
            </Field>
            <Field label="Deposit Due Date">
              <input
                type="date"
                className={inputClass}
                value={draft.depositDueDate}
                onChange={(e) => onChange({ depositDueDate: e.target.value })}
              />
            </Field>
            <Field label="Deposit Received Date">
              <input
                type="date"
                className={inputClass}
                value={draft.depositReceivedAt}
                onChange={(e) => onChange({ depositReceivedAt: e.target.value })}
              />
            </Field>
            <Field label="Contract / Acceptance Received">
              <input
                type="date"
                className={inputClass}
                value={draft.contractAcceptedAt}
                onChange={(e) => onChange({ contractAcceptedAt: e.target.value })}
              />
            </Field>
            <Field label="Final Guest Numbers Due">
              <input
                type="date"
                className={inputClass}
                value={draft.finalGuestCountDueDate}
                onChange={(e) => onChange({ finalGuestCountDueDate: e.target.value })}
              />
            </Field>
            <Field label="Final Payment Due">
              <input
                type="date"
                className={inputClass}
                value={draft.finalPaymentDueDate}
                onChange={(e) => onChange({ finalPaymentDueDate: e.target.value })}
              />
            </Field>
          </div>
        </Card>
      )}

      {draft.status === "rejected" && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-navy-dark">Lost Details</h2>
          <p className="text-sm text-navy-dark/70">
            Reason: <span className="font-medium text-navy-dark">{draft.lostReason || "—"}</span>
          </p>
          {draft.statusReason && <p className="mt-1 text-sm text-navy-dark/70">Notes: {draft.statusReason}</p>}
          <p className="mt-2 text-xs text-navy-dark/50">
            Set via the status dropdown next to Save — change status to Rejected again to update these.
          </p>
        </Card>
      )}

      {draft.status === "cancelled" && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-navy-dark">Cancellation Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cancellation Date">
              <input
                type="date"
                className={inputClass}
                value={draft.cancelledAt}
                onChange={(e) => onChange({ cancelledAt: e.target.value })}
              />
            </Field>
            <Field label="Who Cancelled">
              <input
                type="text"
                className={inputClass}
                value={draft.cancelledBy}
                onChange={(e) => onChange({ cancelledBy: e.target.value })}
              />
            </Field>
            <Field label="Cancellation Fee Charged (AUD)">
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={draft.cancellationFeeChargedCents != null ? draft.cancellationFeeChargedCents / 100 : ""}
                onChange={(e) =>
                  onChange({
                    cancellationFeeChargedCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null,
                  })
                }
              />
            </Field>
            <Field label="Refund Amount (AUD)">
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={draft.refundAmountCents != null ? draft.refundAmountCents / 100 : ""}
                onChange={(e) =>
                  onChange({ refundAmountCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null })
                }
              />
            </Field>
          </div>
          <p className="mt-3 text-sm text-navy-dark/70">
            Reason: <span className="font-medium text-navy-dark">{draft.cancellationReason || "—"}</span>
            {draft.depositRetainedOrRefunded && ` · Deposit ${draft.depositRetainedOrRefunded}`}
          </p>
          {draft.statusReason && <p className="mt-1 text-sm text-navy-dark/70">Notes: {draft.statusReason}</p>}
        </Card>
      )}
    </div>
  );
}
