"use client";

import { useState, useTransition } from "react";
import { changeQuoteStatus } from "@/actions/status";
import {
  CANCELLATION_REASONS,
  LOST_REASONS,
  QUOTE_STATUSES,
  QUOTE_STATUS_LABELS,
  STATUSES_REQUIRING_REASON,
  type QuoteStatus,
} from "@/lib/constants";

export function StatusChangeControl({
  quoteId,
  status,
  onChanged,
}: {
  quoteId: string | null;
  status: QuoteStatus;
  onChanged: (status: QuoteStatus) => void;
}) {
  const [pendingStatus, setPendingStatus] = useState<QuoteStatus | null>(null);
  const [categoryReason, setCategoryReason] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function requestStatusChange(newStatus: QuoteStatus) {
    if (!quoteId) return;
    if (STATUSES_REQUIRING_REASON.includes(newStatus)) {
      setPendingStatus(newStatus);
      setCategoryReason("");
      setReason("");
      setError(null);
      return;
    }
    submit(newStatus, null, null);
  }

  function submit(newStatus: QuoteStatus, statusReason: string | null, category: string | null) {
    if (!quoteId) return;
    startTransition(async () => {
      const result = await changeQuoteStatus(quoteId, newStatus, statusReason, category);
      if (result.error) {
        setError(result.error);
        return;
      }
      onChanged(newStatus);
      setPendingStatus(null);
    });
  }

  const reasonOptions = pendingStatus === "rejected" ? LOST_REASONS : CANCELLATION_REASONS;

  return (
    <div className="flex items-center gap-2">
      <select
        className="rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper disabled:opacity-50"
        value={status}
        disabled={!quoteId || isPending}
        onChange={(e) => requestStatusChange(e.target.value as QuoteStatus)}
        title={!quoteId ? "Save the quote first" : undefined}
      >
        {QUOTE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {QUOTE_STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      {pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-navy-dark">
              Mark quote as {QUOTE_STATUS_LABELS[pendingStatus]}
            </h3>
            <p className="mb-3 text-sm text-navy-dark/70">
              Please select a reason and add any further detail — this is recorded on the quote's audit history.
            </p>

            <label className="mb-1 block text-sm font-medium text-navy-dark">Reason</label>
            <select
              className="mb-3 w-full rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper"
              value={categoryReason}
              onChange={(e) => setCategoryReason(e.target.value)}
            >
              <option value="">Select a reason…</option>
              {reasonOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-sm font-medium text-navy-dark">Further Details</label>
            <textarea
              autoFocus
              className="mb-3 w-full rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Any further detail…"
            />
            {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingStatus(null)}
                className="rounded-md px-3 py-1.5 text-sm text-navy-dark/70 hover:bg-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reason.trim() || !categoryReason || isPending}
                onClick={() => submit(pendingStatus, reason, categoryReason)}
                className="rounded-md bg-navy px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
