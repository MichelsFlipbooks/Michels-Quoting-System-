import { renderToBuffer } from "@react-pdf/renderer";
import { ClientQuotePDF } from "@/components/pdf/ClientQuotePDF";
import { KitchenCopyPDF, type KitchenDietaryLine } from "@/components/pdf/KitchenCopyPDF";
import type { QuoteTotals } from "@/lib/calculations";
import type { Client, EventTimelineItem, Quote, QuoteLineItem } from "@/lib/types";

export async function renderClientQuotePdf(params: {
  quote: Quote;
  client: Client;
  lineItems: QuoteLineItem[];
  totals: QuoteTotals;
  versionNumber: number;
}): Promise<Buffer> {
  return renderToBuffer(
    ClientQuotePDF({
      quote: params.quote,
      client: params.client,
      lineItems: params.lineItems,
      totals: params.totals,
      versionNumber: params.versionNumber,
    }),
  );
}

export async function renderKitchenCopyPdf(params: {
  quote: Quote;
  client: Client;
  lineItems: QuoteLineItem[];
  dietary: KitchenDietaryLine[];
  timeline: EventTimelineItem[];
}): Promise<Buffer> {
  return renderToBuffer(
    KitchenCopyPDF({
      quote: params.quote,
      client: params.client,
      lineItems: params.lineItems,
      dietary: params.dietary,
      timeline: params.timeline,
    }),
  );
}
