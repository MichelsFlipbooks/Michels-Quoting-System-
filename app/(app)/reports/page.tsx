import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatAUD, formatAustralianDateShort } from "@/lib/format";
import { getTrackingReport } from "@/lib/queries";
import { listStaffMembers } from "@/actions/staff";
import {
  CANCELLATION_REASONS,
  DELIVERY_REGIONS,
  DELIVERY_REGION_LABELS,
  ENQUIRY_SOURCES,
  EVENT_TYPES,
  LOST_REASONS,
  QUOTE_STATUSES,
  QUOTE_STATUS_LABELS,
  type QuoteStatus,
} from "@/lib/constants";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-dark/50">{label}</p>
      <p className="mt-2 text-xl font-semibold text-navy-dark">{value}</p>
    </Card>
  );
}

function BreakdownCard({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold text-navy-dark">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-navy-dark/50">No data yet.</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {items.map((item) => (
            <li key={item.label} className="flex items-center justify-between">
              <span className="text-navy-dark/80">{item.label}</span>
              <span className="font-semibold text-navy-dark">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

interface ReportSearchParams {
  dateFrom?: string;
  dateTo?: string;
  eventDateFrom?: string;
  eventDateTo?: string;
  status?: string;
  assignedStaffId?: string;
  enquirySource?: string;
  eventType?: string;
  deliveryRegion?: string;
  client?: string;
  lostReason?: string;
  cancellationReason?: string;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<ReportSearchParams>;
}) {
  const params = await searchParams;
  const [report, staff] = await Promise.all([
    getTrackingReport({
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      eventDateFrom: params.eventDateFrom,
      eventDateTo: params.eventDateTo,
      status: params.status as QuoteStatus | undefined,
      assignedStaffId: params.assignedStaffId,
      enquirySource: params.enquirySource,
      eventType: params.eventType,
      deliveryRegion: params.deliveryRegion,
      client: params.client,
      lostReason: params.lostReason,
      cancellationReason: params.cancellationReason,
    }),
    listStaffMembers(true),
  ]);

  const selectClass =
    "w-full rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper";

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-navy-dark">Enquiry & BDM Tracking Report</h1>
      <p className="mb-6 text-sm text-navy-dark/60">Conversion summary, follow-ups and client outcomes.</p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Total Enquiries" value={String(report.totalEnquiries)} />
        <Metric label="Confirmed" value={String(report.confirmedCount)} />
        <Metric label="Lost" value={String(report.lostCount)} />
        <Metric label="Cancelled" value={String(report.cancelledCount)} />
        <Metric label="Conversion Rate" value={`${report.conversionRatePercent.toFixed(0)}%`} />
        <Metric
          label="Avg. Days to Confirm"
          value={report.averageDaysToConfirmation != null ? report.averageDaysToConfirmation.toFixed(1) : "—"}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Estimated Enquiry Value" value={formatAUD(report.totalEstimatedEnquiryValueCents)} />
        <Metric label="Confirmed Value" value={formatAUD(report.confirmedValueCents)} />
        <Metric label="Lost Value" value={formatAUD(report.lostValueCents)} />
        <Metric label="Cancelled Value" value={formatAUD(report.cancelledValueCents)} />
      </div>

      <Card className="mb-6">
        <form method="get" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Client</span>
            <input
              type="text"
              name="client"
              defaultValue={params.client}
              className={selectClass}
              placeholder="Name or organisation"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Status</span>
            <select name="status" defaultValue={params.status ?? ""} className={selectClass}>
              <option value="">All</option>
              {QUOTE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {QUOTE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Assigned Staff</span>
            <select name="assignedStaffId" defaultValue={params.assignedStaffId ?? ""} className={selectClass}>
              <option value="">All</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Enquiry Source</span>
            <select name="enquirySource" defaultValue={params.enquirySource ?? ""} className={selectClass}>
              <option value="">All</option>
              {ENQUIRY_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Event Type</span>
            <select name="eventType" defaultValue={params.eventType ?? ""} className={selectClass}>
              <option value="">All</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Location</span>
            <select name="deliveryRegion" defaultValue={params.deliveryRegion ?? ""} className={selectClass}>
              <option value="">All</option>
              {DELIVERY_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {DELIVERY_REGION_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Lost Reason</span>
            <select name="lostReason" defaultValue={params.lostReason ?? ""} className={selectClass}>
              <option value="">All</option>
              {LOST_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Cancellation Reason</span>
            <select name="cancellationReason" defaultValue={params.cancellationReason ?? ""} className={selectClass}>
              <option value="">All</option>
              {CANCELLATION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Enquiry Date From</span>
            <input type="date" name="dateFrom" defaultValue={params.dateFrom} className={selectClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Enquiry Date To</span>
            <input type="date" name="dateTo" defaultValue={params.dateTo} className={selectClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Event Date From</span>
            <input type="date" name="eventDateFrom" defaultValue={params.eventDateFrom} className={selectClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy-dark">Event Date To</span>
            <input type="date" name="eventDateTo" defaultValue={params.eventDateTo} className={selectClass} />
          </label>
          <div className="col-span-full flex gap-2">
            <button type="submit" className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white">
              Apply Filters
            </button>
            <Link href="/reports" className="rounded-md px-4 py-2 text-sm font-medium text-navy-dark/60 hover:bg-cream">
              Clear
            </Link>
          </div>
        </form>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BreakdownCard title="Most Common Lost Reasons" items={report.topLostReasons} />
        <BreakdownCard title="Most Common Cancellation Reasons" items={report.topCancellationReasons} />
        <BreakdownCard title="Enquiries by Source" items={report.bySource} />
        <BreakdownCard title="Results by Assigned Staff" items={report.byStaff} />
        <BreakdownCard title="Events by Location" items={report.byLocation} />
        <BreakdownCard title="Events by Month" items={report.byMonth} />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border-soft bg-cream text-left text-xs font-semibold uppercase tracking-wide text-navy-dark/70">
            <tr>
              <th className="px-4 py-3">Event Date</th>
              <th className="px-4 py-3">Quote #</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {report.rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">{formatAustralianDateShort(row.event_date)}</td>
                <td className="px-4 py-3">
                  <Link href={`/quotes/${row.id}`} className="font-medium text-copper hover:underline">
                    {row.quote_number}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.client.contact_name}</td>
                <td className="px-4 py-3">{QUOTE_STATUS_LABELS[row.status]}</td>
                <td className="px-4 py-3">{row.assigned_staff_name ?? "—"}</td>
                <td className="px-4 py-3">{formatAUD(row.totalIncGstCents)}</td>
              </tr>
            ))}
            {report.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-navy-dark/50">
                  No records match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
