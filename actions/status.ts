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
): Promise<{ quote?: Quote; error?: string }> {
  if (STATUSES_REQUIRING_REASON.includes(newStatus) && !reason?.trim()) {
    return { error: "A reason is required to mark a quote as Rejected or Cancelled." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: previous } = await supabase
    .from("quotes")
    .select("status")
    .eq("id", quoteId)
    .single();

  const { data, error } = await supabase
    .from("quotes")
    .update({ status: newStatus, status_reason: reason })
    .eq("id", quoteId)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await logAudit(supabase, quoteId, user?.id, STATUS_AUDIT_ACTION[newStatus] ?? "status_changed", {
    previous_status: previous?.status ?? null,
    new_status: newStatus,
    reason,
  });

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/");
  revalidatePath("/archive");

  return { quote: data as Quote };
}
