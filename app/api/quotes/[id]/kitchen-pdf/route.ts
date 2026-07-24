import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderKitchenCopyPdf } from "@/lib/pdf-render";
import type { EventTimelineItem, QuoteLineItem } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).maybeSingle();
  if (!quote) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  const [{ data: client }, { data: lineItems }, { data: dietaryRows }, { data: timeline }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", quote.client_id).single(),
    supabase.from("quote_line_items").select("*").eq("quote_id", id).order("sort_order"),
    supabase
      .from("quote_dietary_requirements")
      .select("guest_count, notes, dietary_requirement:dietary_requirements(name)")
      .eq("quote_id", id),
    supabase.from("event_timeline_items").select("*").eq("quote_id", id).order("sort_order"),
  ]);

  const dietary = (dietaryRows ?? []).map((row) => ({
    name: (row.dietary_requirement as unknown as { name: string } | null)?.name ?? "Unknown",
    guestCount: row.guest_count,
    notes: row.notes,
  }));

  const pdfBuffer = await renderKitchenCopyPdf({
    quote,
    client,
    lineItems: (lineItems as QuoteLineItem[]) ?? [],
    dietary,
    timeline: (timeline as EventTimelineItem[]) ?? [],
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quote.quote_number}-kitchen-copy.pdf"`,
    },
  });
}
