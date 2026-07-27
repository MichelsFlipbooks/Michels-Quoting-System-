"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { STATUSES_REQUIRING_REASON, type QuoteStatus } from "@/lib/constants";
import type { AuditAction } from "@/lib/constants";
import type { Quote } from "@/lib/types";

const STATUS_AUDIT_ACTION: Partial<Record<QuoteStatus, AuditAction>> = {
  confirmed: "quote_confirmed",
  rejected: "quote_rejected",
  cancelled: "quote_cancelled",
};

export async function changeQuoteStatus(
  quoteId: string,
  newStatus: QuoteStatus,
  reason: string | null,
  categoryReason: string | null = null,
): Promise<{ quote?: Quote; error?: string }> {
  if (STATUSES_REQUIRING_REASON.includes(newStatus) && (!reason?.trim() || !categoryReason)) {
    return { error: "A reason is required to mark a quote as Rejected or Cancelled." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: previous } = await supabase
    .from("quotes")
    .select("status, confirmed_at, cancelled_at")
    .eq("id", quoteId)
    .single();

  const today = new Date().toISOString().slice(0, 10);
  const updateFields: Record<string, unknown> = { status: newStatus, status_reason: reason };

  if (newStatus === "rejected") {
    updateFields.lost_reason = categoryReason;
  } else if (newStatus === "cancelled") {
    updateFields.cancellation_reason = categoryReason;
    if (!previous?.cancelled_at) updateFields.cancelled_at = today;
  } else if (newStatus === "confirmed" && !previous?.confirmed_at) {
    updateFields.confirmed_at = today;
  }

  const { data, error } = await supabase
    .from("quotes")
    .update(updateFields)
    .eq("id", quoteId)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await logAudit(supabase, quoteId, user?.id, STATUS_AUDIT_ACTION[newStatus] ?? "status_changed", {
    previous_status: previous?.status ?? null,
    new_status: newStatus,
    reason,
    category_reason: categoryReason,
  });

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/");
  revalidatePath("/archive");

  return { quote: data as Quote };
}
