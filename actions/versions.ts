"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { computeQuoteTotals } from "@/lib/calculations";
import { renderClientQuotePdf } from "@/lib/pdf-render";
import type { QuoteSnapshot, QuoteVersion } from "@/lib/types";

export async function issueQuoteVersion(
  quoteId: string,
  reasonForRevision: string | null,
): Promise<{ version?: QuoteVersion; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", quoteId).single();
  if (!quote) return { error: "Quote not found." };

  const [{ data: client }, { data: lineItems }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", quote.client_id).single(),
    supabase.from("quote_line_items").select("*").eq("quote_id", quoteId).order("sort_order"),
  ]);
  if (!client) return { error: "Client not found." };

  const totals = computeQuoteTotals({
    lineItems: lineItems ?? [],
    discountType: quote.discount_type,
    discountValue: quote.discount_value,
    depositType: quote.deposit_type,
    depositValue: quote.deposit_value,
    guestNumbers: quote.guest_numbers,
  });

  const versionNumber = quote.current_version_number + 1;

  const { data: lastVersion } = await supabase
    .from("quote_versions")
    .select("new_total_cents")
    .eq("quote_id", quoteId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const snapshot: QuoteSnapshot = {
    quote,
    client,
    lineItems: lineItems ?? [],
    totals,
    generatedAt: new Date().toISOString(),
  };

  let pdfUrl: string | null = null;
  try {
    const pdfBuffer = await renderClientQuotePdf({
      quote,
      client,
      lineItems: lineItems ?? [],
      totals,
      versionNumber,
    });
    const path = `${quoteId}/v${versionNumber}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("quote-pdfs")
      .upload(path, pdfBuffer, { contentType: "application/pdf", upsert: true });
    if (!uploadError) {
      pdfUrl = supabase.storage.from("quote-pdfs").getPublicUrl(path).data.publicUrl;
    }
  } catch {
    // PDF generation/upload failure shouldn't block the version record itself;
    // the client PDF can still be regenerated on demand from the snapshot.
  }

  const { data: version, error: versionError } = await supabase
    .from("quote_versions")
    .insert({
      quote_id: quoteId,
      version_number: versionNumber,
      created_by: user?.id ?? null,
      reason_for_revision: reasonForRevision,
      previous_total_cents: lastVersion?.new_total_cents ?? null,
      new_total_cents: totals.totalIncGstCents,
      snapshot_data: snapshot,
      pdf_url: pdfUrl,
    })
    .select("*")
    .single();

  if (versionError) return { error: versionError.message };

  const nextStatus = ["enquiry", "quote_in_progress"].includes(quote.status) ? "quote_sent" : quote.status;

  await supabase
    .from("quotes")
    .update({ current_version_number: versionNumber, status: nextStatus })
    .eq("id", quoteId);

  await logAudit(supabase, quoteId, user?.id, "quote_sent", { version_number: versionNumber, reason: reasonForRevision });
  await logAudit(supabase, quoteId, user?.id, "pdf_generated", { version_number: versionNumber });

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath(`/quotes/${quoteId}/client-pdf`);
  revalidatePath("/");

  return { version: version as QuoteVersion };
}

export async function listQuoteVersions(quoteId: string): Promise<QuoteVersion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quote_versions")
    .select("*")
    .eq("quote_id", quoteId)
    .order("version_number", { ascending: false });
  return (data as QuoteVersion[]) ?? [];
}
