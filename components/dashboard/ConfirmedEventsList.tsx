import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatAUD, formatAustralianDateLong, formatMonthLabel } from "@/lib/format";
import type { ConfirmedEventGroup } from "@/lib/queries";

export function ConfirmedEventsList({ groups }: { groups: ConfirmedEventGroup[] }) {
  if (groups.length === 0) {
    return (
      <Card>
        <p className="text-center text-navy-dark/50">No confirmed events yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.monthKey}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy-dark/60">
            {formatMonthLabel(group.monthKey)}
          </h3>
          <div className="space-y-3">
            {group.events.map((event) => (
              <Link key={event.id} href={`/quotes/${event.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-navy-dark">{formatAustralianDateLong(event.event_date)}</p>
                      <p className="text-sm text-navy-dark/70">
                        {event.event_name ?? "Untitled Event"} — {event.client.contact_name}
                        {event.client.organisation ? ` (${event.client.organisation})` : ""}
                      </p>
                      <p className="text-xs text-navy-dark/50">
                        {event.event_type ?? "—"} · {event.guest_numbers ?? "—"} guests · {event.staffingSummary}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-navy-dark">{formatAUD(event.totalIncGstCents)}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
