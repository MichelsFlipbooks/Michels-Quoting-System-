import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditAction } from "./constants";

export async function logAudit(
  supabase: SupabaseClient,
  quoteId: string | null,
  userId: string | null | undefined,
  action: AuditAction,
  details: Record<string, unknown> = {},
) {
  await supabase.from("audit_logs").insert({
    quote_id: quoteId,
    user_id: userId ?? null,
    action,
    details,
  });
}
