import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderClientQuotePdf } from "@/lib/pdf-render";
import type { QuoteSnapshot } from "@/lib/types";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const versionParam = searchParams.get("version");

  const supabase = await createClient();

  let query = supabase.from("quote_versions").select("*").eq("quote_id", id);
  query = versionParam
    ? query.eq("version_number", Number(versionParam))
    : query.order("version_number", { ascending: false }).limit(1);

  const { data: version } = await query.maybeSingle();

  if (!version) {
    return NextResponse.json(
      { error: "No quote has been issued yet. Use 'Issue Quote' in the quote builder first." },
      { status: 404 },
    );
  }

  const snapshot = version.snapshot_data as QuoteSnapshot;
  const pdfBuffer = await renderClientQuotePdf({
    quote: snapshot.quote,
    client: snapshot.client,
    lineItems: snapshot.lineItems,
    totals: snapshot.totals,
    versionNumber: version.version_number,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${snapshot.quote.quote_number}-v${version.version_number}.pdf"`,
    },
  });
}
