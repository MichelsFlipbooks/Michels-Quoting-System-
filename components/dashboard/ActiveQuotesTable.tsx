import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatAUD, formatAustralianDateShort } from "@/lib/format";
import type { QuoteWithTotals } from "@/lib/queries";

export function ActiveQuotesTable({ quotes }: { quotes: QuoteWithTotals[] }) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-border-soft bg-cream text-left text-xs font-semibold uppercase tracking-wide text-navy-dark/70">
          <tr>
            <th className="px-4 py-3">Event Date</th>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Organisation</th>
            <th className="px-4 py-3">Event Type</th>
            <th className="px-4 py-3">Guests</th>
            <th className="px-4 py-3">Quote Value</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Next Follow-Up</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-soft">
          {quotes.map((quote) => (
            <tr key={quote.id} className="cursor-pointer hover:bg-cream/50">
              <td className="px-4 py-3">
                <Link href={`/quotes/${quote.id}`} className="block font-medium text-navy-dark">
                  {formatAustralianDateShort(quote.event_date)}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link href={`/quotes/${quote.id}`} className="block">
                  {quote.client.contact_name}
                </Link>
              </td>
              <td className="px-4 py-3">{quote.client.organisation ?? "—"}</td>
              <td className="px-4 py-3">{quote.event_type ?? "—"}</td>
              <td className="px-4 py-3">{quote.guest_numbers ?? "—"}</td>
              <td className="px-4 py-3">{formatAUD(quote.totalIncGstCents)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={quote.status} />
              </td>
              <td className="px-4 py-3">{formatAustralianDateShort(quote.next_follow_up_date)}</td>
            </tr>
          ))}
          {quotes.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-navy-dark/50">
                No active quotes.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}
