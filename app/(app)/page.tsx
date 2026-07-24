import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { ActiveQuotesTable } from "@/components/dashboard/ActiveQuotesTable";
import { ConfirmedEventsList } from "@/components/dashboard/ConfirmedEventsList";
import { getDashboardMetrics, listActiveQuotes, listConfirmedEventsByMonth } from "@/lib/queries";

export default async function DashboardPage() {
  const [metrics, activeQuotes, confirmedGroups] = await Promise.all([
    getDashboardMetrics(),
    listActiveQuotes(),
    listConfirmedEventsByMonth(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-navy-dark">Dashboard</h1>

      <MetricsCards metrics={metrics} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-navy-dark">Active Quotes</h2>
          <ActiveQuotesTable quotes={activeQuotes} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-navy-dark">Confirmed Events</h2>
          <ConfirmedEventsList groups={confirmedGroups} />
        </section>
      </div>
    </div>
  );
}
