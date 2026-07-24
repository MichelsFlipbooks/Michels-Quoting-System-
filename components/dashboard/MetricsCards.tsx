import { Card } from "@/components/ui/Card";
import { formatAUD } from "@/lib/format";
import type { DashboardMetrics } from "@/lib/queries";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-dark/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-navy-dark">{value}</p>
    </Card>
  );
}

export function MetricsCards({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <Metric label="Active Quotes" value={String(metrics.activeQuoteCount)} />
      <Metric label="Active Quote Value" value={formatAUD(metrics.activeQuoteValueCents)} />
      <Metric label="Confirmed Events" value={String(metrics.confirmedEventCount)} />
      <Metric label="Confirmed Value" value={formatAUD(metrics.confirmedEventValueCents)} />
      <Metric label="Follow-Ups Due" value={String(metrics.followUpsDue)} />
      <Metric label="Events in 30 Days" value={String(metrics.eventsWithin30Days)} />
    </div>
  );
}
