import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatAUD, formatAustralianDateShort } from "@/lib/format";
import { listArchivedQuotes } from "@/lib/queries";
import { EVENT_TYPES, SERVICE_LEVELS } from "@/lib/constants";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; eventType?: string; month?: string; serviceLevel?: string }>;
}) {
  const { q, eventType, month, serviceLevel } = await searchParams;

  const quotes = await listArchivedQuotes({ query: q, eventType, month, serviceLevel });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-navy-dark">Archive</h1>
      <p className="mb-4 text-sm text-navy-dark/60">
        Rejected and cancelled quotes. These are excluded from the main dashboard but remain searchable here for
        reporting.
      </p>

      <Card className="mb-6">
        <form method="get" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Search</span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Client, org, email, quote #, event"
              className="w-full rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Event Type</span>
            <select
              name="eventType"
              defaultValue={eventType ?? ""}
              className="w-full rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper"
            >
              <option value="">All</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Service Level</span>
            <select
              name="serviceLevel"
              defaultValue={serviceLevel ?? ""}
              className="w-full rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper"
            >
              <option value="">All</option>
              {SERVICE_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Event Month</span>
            <input
              type="month"
              name="month"
              defaultValue={month}
              className="w-full rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper"
            />
          </label>
          <div className="col-span-full flex gap-2">
            <button type="submit" className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white">
              Apply Filters
            </button>
            <Link href="/archive" className="rounded-md px-4 py-2 text-sm font-medium text-navy-dark/60 hover:bg-cream">
              Clear
            </Link>
          </div>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border-soft bg-cream text-left text-xs font-semibold uppercase tracking-wide text-navy-dark/70">
            <tr>
              <th className="px-4 py-3">Event Date</th>
              <th className="px-4 py-3">Quote #</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {quotes.map((quote) => (
              <tr key={quote.id}>
                <td className="px-4 py-3">{formatAustralianDateShort(quote.event_date)}</td>
                <td className="px-4 py-3">
                  <Link href={`/quotes/${quote.id}`} className="font-medium text-copper hover:underline">
                    {quote.quote_number}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {quote.client.contact_name}
                  {quote.client.organisation ? ` (${quote.client.organisation})` : ""}
                </td>
                <td className="px-4 py-3">{quote.event_name ?? "—"}</td>
                <td className="px-4 py-3">{formatAUD(quote.totalIncGstCents)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={quote.status} />
                </td>
                <td className="px-4 py-3 text-navy-dark/70">{quote.status_reason ?? "—"}</td>
              </tr>
            ))}
            {quotes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-navy-dark/50">
                  No archived quotes match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
