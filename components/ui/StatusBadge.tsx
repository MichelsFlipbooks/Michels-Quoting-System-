import { clsx } from "clsx";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/constants";

const STATUS_STYLES: Record<QuoteStatus, string> = {
  enquiry: "bg-slate-100 text-slate-700",
  quote_in_progress: "bg-amber-100 text-amber-800",
  quote_sent: "bg-blue-100 text-blue-800",
  follow_up_due: "bg-copper/15 text-copper-dark",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status],
      )}
    >
      {QUOTE_STATUS_LABELS[status]}
    </span>
  );
}
