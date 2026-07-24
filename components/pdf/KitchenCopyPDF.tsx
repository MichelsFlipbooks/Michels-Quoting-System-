import { Document, Page, Text, View } from "@react-pdf/renderer";
import { formatAustralianDateLong, formatAustralianTime } from "@/lib/format";
import { LINE_ITEM_SECTION_LABELS } from "@/lib/constants";
import type { Client, EventTimelineItem, Quote, QuoteLineItem } from "@/lib/types";
import { pdfStyles as s } from "./styles";

export interface KitchenDietaryLine {
  name: string;
  guestCount: number | null;
  notes: string | null;
}

export function KitchenCopyPDF({
  quote,
  client,
  lineItems,
  dietary,
  timeline,
}: {
  quote: Quote;
  client: Client;
  lineItems: QuoteLineItem[];
  dietary: KitchenDietaryLine[];
  timeline: EventTimelineItem[];
}) {
  const foodItems = lineItems.filter((li) => li.section === "food");
  const staffingItems = lineItems.filter((li) => li.section === "staffing");
  const equipmentItems = lineItems.filter((li) => li.section === "equipment");
  const otherItems = lineItems.filter(
    (li) => !["food", "staffing", "equipment"].includes(li.section),
  );

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>Kitchen & Operations Copy</Text>
        <Text style={s.metaText}>Internal use only — not for client distribution</Text>

        <View style={[s.twoCol, { marginTop: 12 }]}>
          <View style={s.col}>
            <Text style={s.label}>Event Number</Text>
            <Text style={s.value}>{quote.quote_number}</Text>
            <Text style={s.label}>Client</Text>
            <Text style={s.value}>
              {client.contact_name} {client.organisation ? `(${client.organisation})` : ""}
            </Text>
            <Text style={s.label}>Event Date</Text>
            <Text style={s.value}>
              {quote.event_date ? formatAustralianDateLong(quote.event_date) : "—"}
              {quote.start_time ? `, ${formatAustralianTime(quote.start_time)}` : ""}
              {quote.finish_time ? ` – ${formatAustralianTime(quote.finish_time)}` : ""}
            </Text>
          </View>
          <View style={s.col}>
            <Text style={s.label}>Venue</Text>
            <Text style={s.value}>
              {quote.venue_name ?? "—"} {quote.venue_address ? `, ${quote.venue_address}` : ""}
            </Text>
            <Text style={s.label}>Guest Numbers</Text>
            <Text style={s.value}>{quote.guest_numbers ?? "—"}</Text>
            <Text style={s.label}>Event Contact</Text>
            <Text style={s.value}>
              {quote.event_contact_name ?? "—"} {quote.event_contact_phone ? `— ${quote.event_contact_phone}` : ""}
            </Text>
          </View>
        </View>

        <Text style={s.h2}>Access, Parking & Kitchen Facilities</Text>
        <Text style={s.value}>Access: {quote.access_notes || "—"}</Text>
        <Text style={s.value}>Parking / Loading: {quote.parking_loading_details || "—"}</Text>
        <Text style={s.value}>Kitchen Facilities: {quote.kitchen_facilities || "—"}</Text>

        {dietary.length > 0 && (
          <View>
            <Text style={s.h2}>Dietary Requirements</Text>
            {dietary.map((d, idx) => (
              <Text style={s.value} key={idx}>
                {d.name}
                {d.guestCount ? ` — ${d.guestCount} guests` : ""}
                {d.notes ? ` (${d.notes})` : ""}
              </Text>
            ))}
          </View>
        )}

        {timeline.length > 0 && (
          <View wrap={false}>
            <Text style={s.h2}>Run Sheet / Timeline</Text>
            {timeline
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((t) => (
                <Text style={s.value} key={t.id}>
                  {t.time ? formatAustralianTime(t.time) : "—"} — {t.description}
                </Text>
              ))}
          </View>
        )}

        <Text style={s.h2}>Full Menu & Quantities</Text>
        {foodItems.map((item) => (
          <Text style={s.value} key={item.id}>
            {item.description} — Qty {item.quantity} {item.unit}
            {item.internal_description ? ` (${item.internal_description})` : ""}
          </Text>
        ))}

        {staffingItems.length > 0 && (
          <View>
            <Text style={s.h2}>Staffing</Text>
            {staffingItems.map((item) => (
              <Text style={s.value} key={item.id}>
                {item.description} — {item.quantity} staff x {item.hours ?? 0}h
              </Text>
            ))}
          </View>
        )}

        {equipmentItems.length > 0 && (
          <View>
            <Text style={s.h2}>Equipment / Packing List</Text>
            {equipmentItems.map((item) => (
              <Text style={s.value} key={item.id}>
                {item.description} — Qty {item.quantity} {item.unit}
              </Text>
            ))}
          </View>
        )}

        {otherItems.length > 0 && (
          <View>
            <Text style={s.h2}>Other ({otherItems.map((i) => LINE_ITEM_SECTION_LABELS[i.section]).join(", ")})</Text>
            {otherItems.map((item) => (
              <Text style={s.value} key={item.id}>
                {item.description} — Qty {item.quantity} {item.unit}
              </Text>
            ))}
          </View>
        )}

        {quote.internal_notes && (
          <View>
            <Text style={s.h2}>Internal Notes</Text>
            <Text style={s.value}>{quote.internal_notes}</Text>
          </View>
        )}

        <Text style={s.h2} break>
          Food Safety Record
        </Text>
        <View style={s.table}>
          <View style={s.tableHeaderRow}>
            <Text style={[s.th, { flex: 2 }]}>Item</Text>
            <Text style={[s.th, { flex: 1 }]}>Time Prepared</Text>
            <Text style={[s.th, { flex: 1 }]}>Temp (°C)</Text>
            <Text style={[s.th, { flex: 1 }]}>Initials</Text>
          </View>
          {foodItems.map((item) => (
            <View style={s.tableRow} key={item.id}>
              <Text style={[s.td, { flex: 2 }]}>{item.description}</Text>
              <Text style={[s.td, { flex: 1 }]}> </Text>
              <Text style={[s.td, { flex: 1 }]}> </Text>
              <Text style={[s.td, { flex: 1 }]}> </Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={s.label}>Staff Sign-Off</Text>
          <Text style={[s.value, { marginTop: 20 }]}>Name: ______________________  Signature: ______________________  Date: ____________</Text>
        </View>
      </Page>
    </Document>
  );
}
