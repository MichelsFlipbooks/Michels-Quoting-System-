import path from "node:path";
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { CLIENT_STAFFING_NOTE } from "@/lib/constants";
import { formatAUD, formatAustralianDateLong, formatAustralianDateShort, formatAustralianTime } from "@/lib/format";
import { lineItemTotalCents, type QuoteTotals } from "@/lib/calculations";
import type { Client, Quote, QuoteLineItem } from "@/lib/types";
import { pdfStyles as s } from "./styles";

const LOGO_PATH = path.join(process.cwd(), "public", "brand", "michels-logo-navy.png");

const SECTION_ORDER: { key: QuoteLineItem["section"]; label: string }[] = [
  { key: "food", label: "Food & Menu" },
  { key: "beverage", label: "Beverages" },
  { key: "equipment", label: "Equipment" },
  { key: "delivery_travel", label: "Delivery & Travel" },
  { key: "additional_charge", label: "Optional Additions & Charges" },
];

function LineItemsTable({ items }: { items: QuoteLineItem[] }) {
  return (
    <View style={s.table}>
      <View style={s.tableHeaderRow}>
        <Text style={[s.th, s.colDescription]}>Description</Text>
        <Text style={[s.th, s.colQty]}>Qty</Text>
        <Text style={[s.th, s.colPrice]}>Unit Price</Text>
        <Text style={[s.th, s.colTotal]}>Total</Text>
      </View>
      {items.map((item) => (
        <View style={s.tableRow} key={item.id}>
          <Text style={[s.td, s.colDescription]}>{item.description}</Text>
          <Text style={[s.td, s.colQty]}>
            {item.quantity}
            {item.hours ? ` x ${item.hours}h` : ""} {item.unit !== "each" ? item.unit : ""}
          </Text>
          <Text style={[s.td, s.colPrice]}>
            {item.is_included_selection ? "Included" : formatAUD(item.unit_price_cents)}
          </Text>
          <Text style={[s.td, s.colTotal]}>
            {item.is_included_selection ? "—" : formatAUD(lineItemTotalCents(item))}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ClientQuotePDF({
  quote,
  client,
  lineItems,
  totals,
  versionNumber,
}: {
  quote: Quote;
  client: Client;
  lineItems: QuoteLineItem[];
  totals: QuoteTotals;
  versionNumber: number;
}) {
  const hasStaffing = lineItems.some((li) => li.section === "staffing");

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <Image src={LOGO_PATH} style={s.logo} />
          <View style={s.titleBlock}>
            <Text style={s.h1}>Quote {quote.quote_number}</Text>
            <Text style={s.metaText}>Version {versionNumber}</Text>
            <Text style={s.metaText}>Date: {formatAustralianDateShort(quote.quote_date)}</Text>
            {quote.expiry_date && (
              <Text style={s.metaText}>Expires: {formatAustralianDateShort(quote.expiry_date)}</Text>
            )}
          </View>
        </View>

        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.h2}>Client Details</Text>
            <Text style={s.label}>Contact</Text>
            <Text style={s.value}>{client.contact_name}</Text>
            {client.organisation && (
              <>
                <Text style={s.label}>Organisation</Text>
                <Text style={s.value}>{client.organisation}</Text>
              </>
            )}
            <Text style={s.label}>Phone / Email</Text>
            <Text style={s.value}>
              {client.phone ?? "—"} / {client.email ?? "—"}
            </Text>
          </View>
          <View style={s.col}>
            <Text style={s.h2}>Event Details</Text>
            <Text style={s.label}>Event</Text>
            <Text style={s.value}>{quote.event_name ?? "—"} ({quote.event_type ?? "—"})</Text>
            <Text style={s.label}>Date & Time</Text>
            <Text style={s.value}>
              {quote.event_date ? formatAustralianDateLong(quote.event_date) : "—"}
              {quote.start_time ? `, ${formatAustralianTime(quote.start_time)}` : ""}
              {quote.finish_time ? ` – ${formatAustralianTime(quote.finish_time)}` : ""}
            </Text>
            <Text style={s.label}>Venue</Text>
            <Text style={s.value}>
              {quote.venue_name ?? "—"} {quote.venue_address ? `, ${quote.venue_address}` : ""}
            </Text>
            <Text style={s.label}>Guests</Text>
            <Text style={s.value}>{quote.guest_numbers ?? "—"}</Text>
          </View>
        </View>

        {SECTION_ORDER.map(({ key, label }) => {
          const items = lineItems.filter((li) => li.section === key);
          if (items.length === 0) return null;
          return (
            <View key={key} wrap={false}>
              <Text style={s.h2}>{label}</Text>
              <LineItemsTable items={items} />
            </View>
          );
        })}

        {hasStaffing && (
          <View wrap={false}>
            <Text style={s.h2}>Staffing</Text>
            <LineItemsTable items={lineItems.filter((li) => li.section === "staffing")} />
            <Text style={s.note}>{CLIENT_STAFFING_NOTE}</Text>
          </View>
        )}

        <View style={s.totalsBlock} wrap={false}>
          {totals.discountCents > 0 && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Discount</Text>
              <Text style={s.totalsValue}>-{formatAUD(totals.discountCents)}</Text>
            </View>
          )}
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Subtotal (excl. GST)</Text>
            <Text style={s.totalsValue}>{formatAUD(totals.subtotalExGstCents)}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>GST (10%)</Text>
            <Text style={s.totalsValue}>{formatAUD(totals.gstCents)}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={s.totalsEmphasis}>Total (incl. GST)</Text>
            <Text style={s.totalsEmphasis}>{formatAUD(totals.totalIncGstCents)}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Deposit Required</Text>
            <Text style={s.totalsValue}>{formatAUD(totals.depositCents)}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Balance Due</Text>
            <Text style={s.totalsValue}>{formatAUD(totals.balanceDueCents)}</Text>
          </View>
        </View>

        {quote.client_notes && (
          <View wrap={false}>
            <Text style={s.h2}>Notes</Text>
            <Text style={s.value}>{quote.client_notes}</Text>
          </View>
        )}

        <View wrap={false}>
          <Text style={s.h2}>Payment Terms & Conditions</Text>
          <Text style={s.value}>
            A deposit of {formatAUD(totals.depositCents)} is required to confirm this booking. The remaining
            balance of {formatAUD(totals.balanceDueCents)} is due prior to the event. Final guest numbers and
            menu selections must be confirmed no later than 7 days before the event date. This quote is valid
            until {quote.expiry_date ? formatAustralianDateShort(quote.expiry_date) : "the date shown above"}.
            Our chef recommends confirming menu selections early to guarantee seasonal ingredient availability.
          </Text>
        </View>

        <Text style={s.footer}>
          Michels Catering & Events — Quote {quote.quote_number} (Version {versionNumber}) — Prices in AUD, GST
          inclusive where applicable.
        </Text>
      </Page>
    </Document>
  );
}
