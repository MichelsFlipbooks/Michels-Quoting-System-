import { createClient } from "@/lib/supabase/server";
import { computeQuoteTotals, type CalcLineItem } from "@/lib/calculations";
import {
  ACTIVE_QUOTE_STATUSES,
  ARCHIVE_STATUSES,
  CONFIRMED_EVENT_STATUSES,
  type QuoteStatus,
} from "@/lib/constants";
import type {
  CateringPackage,
  CatalogueItem,
  Client,
  DietaryRequirement,
  EventTimelineItem,
  PackageMenuSelection,
  Quote,
  QuoteDietaryRequirement,
  QuoteLineItem,
} from "@/lib/types";

export interface QuoteWithClient extends Quote {
  client: Client;
}

export interface QuoteWithTotals extends QuoteWithClient {
  totalIncGstCents: number;
  staffingSummary: string;
}

function summarizeStaffing(lineItems: QuoteLineItem[]): string {
  const staffLines = lineItems.filter((li) => li.section === "staffing" && li.quantity > 0);
  if (staffLines.length === 0) return "No staffing";
  return staffLines.map((li) => `${li.quantity} ${li.description}`).join(", ");
}

async function attachTotals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  quotes: QuoteWithClient[],
): Promise<QuoteWithTotals[]> {
  if (quotes.length === 0) return [];
  const ids = quotes.map((q) => q.id);
  const { data: lineItems } = await supabase
    .from("quote_line_items")
    .select("*")
    .in("quote_id", ids);

  const byQuote = new Map<string, QuoteLineItem[]>();
  for (const li of (lineItems as QuoteLineItem[]) ?? []) {
    const list = byQuote.get(li.quote_id) ?? [];
    list.push(li);
    byQuote.set(li.quote_id, list);
  }

  return quotes.map((quote) => {
    const items = byQuote.get(quote.id) ?? [];
    const totals = computeQuoteTotals({
      lineItems: items as CalcLineItem[],
      discountType: quote.discount_type,
      discountValue: quote.discount_value,
      depositType: quote.deposit_type,
      depositValue: quote.deposit_value,
      guestNumbers: quote.guest_numbers,
    });
    return {
      ...quote,
      totalIncGstCents: totals.totalIncGstCents,
      staffingSummary: summarizeStaffing(items),
    };
  });
}

export interface QuoteFilters {
  query?: string;
  eventType?: string;
  month?: string; // "2026-05"
  serviceLevel?: string;
}

function applyClientSideFilters(quotes: QuoteWithClient[], filters?: QuoteFilters): QuoteWithClient[] {
  if (!filters) return quotes;
  let results = quotes;

  if (filters.eventType) {
    results = results.filter((q) => q.event_type === filters.eventType);
  }
  if (filters.serviceLevel) {
    results = results.filter((q) => q.service_level === filters.serviceLevel);
  }
  if (filters.month) {
    results = results.filter((q) => q.event_date?.startsWith(filters.month!));
  }
  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    results = results.filter(
      (quote) =>
        quote.quote_number.toLowerCase().includes(q) ||
        quote.event_name?.toLowerCase().includes(q) ||
        quote.client.contact_name.toLowerCase().includes(q) ||
        quote.client.organisation?.toLowerCase().includes(q) ||
        quote.client.email?.toLowerCase().includes(q),
    );
  }

  return results;
}

export async function listActiveQuotes(filters?: QuoteFilters): Promise<QuoteWithTotals[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("*, client:clients(*)")
    .in("status", ACTIVE_QUOTE_STATUSES)
    .order("event_date", { ascending: true, nullsFirst: false });

  const filtered = applyClientSideFilters((data as QuoteWithClient[]) ?? [], filters);
  return attachTotals(supabase, filtered);
}

export interface ConfirmedEventGroup {
  monthKey: string; // "2026-05"
  events: QuoteWithTotals[];
}

export async function listConfirmedEventsByMonth(): Promise<ConfirmedEventGroup[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("*, client:clients(*)")
    .in("status", CONFIRMED_EVENT_STATUSES)
    .order("event_date", { ascending: true, nullsFirst: false });

  const withTotals = await attachTotals(supabase, (data as QuoteWithClient[]) ?? []);

  const groups = new Map<string, QuoteWithTotals[]>();
  for (const quote of withTotals) {
    if (!quote.event_date) continue;
    const monthKey = quote.event_date.slice(0, 7);
    const list = groups.get(monthKey) ?? [];
    list.push(quote);
    groups.set(monthKey, list);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, events]) => ({ monthKey, events }));
}

export interface DashboardMetrics {
  activeQuoteCount: number;
  activeQuoteValueCents: number;
  confirmedEventCount: number;
  confirmedEventValueCents: number;
  followUpsDue: number;
  eventsWithin30Days: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [active, confirmed] = await Promise.all([listActiveQuotes(), listConfirmedEventsByMonth()]);
  const confirmedFlat = confirmed.flatMap((g) => g.events);

  const today = new Date();
  const in30Days = new Date();
  in30Days.setDate(today.getDate() + 30);
  const todayStr = today.toISOString().slice(0, 10);
  const in30Str = in30Days.toISOString().slice(0, 10);

  return {
    activeQuoteCount: active.length,
    activeQuoteValueCents: active.reduce((sum, q) => sum + q.totalIncGstCents, 0),
    confirmedEventCount: confirmedFlat.length,
    confirmedEventValueCents: confirmedFlat.reduce((sum, q) => sum + q.totalIncGstCents, 0),
    followUpsDue: active.filter((q) => q.status === "follow_up_due").length,
    eventsWithin30Days: confirmedFlat.filter(
      (q) => q.event_date && q.event_date >= todayStr && q.event_date <= in30Str,
    ).length,
  };
}

export async function listArchivedQuotes(filters?: QuoteFilters): Promise<QuoteWithTotals[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("*, client:clients(*)")
    .in("status", ARCHIVE_STATUSES)
    .order("event_date", { ascending: false, nullsFirst: false });

  const filtered = applyClientSideFilters((data as QuoteWithClient[]) ?? [], filters);
  return attachTotals(supabase, filtered);
}

export interface QuoteBuilderData {
  quote: Quote;
  client: Client;
  lineItems: QuoteLineItem[];
  dietaryRequirements: QuoteDietaryRequirement[];
  timelineItems: EventTimelineItem[];
}

export async function getQuoteForBuilder(id: string): Promise<QuoteBuilderData | null> {
  const supabase = await createClient();
  const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).maybeSingle();
  if (!quote) return null;

  const [{ data: client }, { data: lineItems }, { data: dietary }, { data: timeline }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", quote.client_id).single(),
    supabase.from("quote_line_items").select("*").eq("quote_id", id).order("sort_order"),
    supabase.from("quote_dietary_requirements").select("*").eq("quote_id", id),
    supabase.from("event_timeline_items").select("*").eq("quote_id", id).order("sort_order"),
  ]);

  return {
    quote: quote as Quote,
    client: client as Client,
    lineItems: (lineItems as QuoteLineItem[]) ?? [],
    dietaryRequirements: (dietary as QuoteDietaryRequirement[]) ?? [],
    timelineItems: (timeline as EventTimelineItem[]) ?? [],
  };
}

export interface PackageWithSelections extends CateringPackage {
  selections: (PackageMenuSelection & { catalogue_item: CatalogueItem | null })[];
}

export async function listCatalogueItems(): Promise<CatalogueItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalogue_items")
    .select("*")
    .eq("active", true)
    .order("category")
    .order("name");
  return (data as CatalogueItem[]) ?? [];
}

export async function listPackagesWithSelections(): Promise<PackageWithSelections[]> {
  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("catering_packages")
    .select("*")
    .eq("active", true)
    .order("name");

  const { data: selections } = await supabase
    .from("package_menu_selections")
    .select("*, catalogue_item:catalogue_items(*)")
    .order("sort_order");

  const selectionsByPackage = new Map<string, PackageWithSelections["selections"]>();
  for (const sel of selections ?? []) {
    const list = selectionsByPackage.get(sel.package_id) ?? [];
    list.push(sel);
    selectionsByPackage.set(sel.package_id, list);
  }

  return ((packages as CateringPackage[]) ?? []).map((pkg) => ({
    ...pkg,
    selections: selectionsByPackage.get(pkg.id) ?? [],
  }));
}

export async function listDietaryRequirements(): Promise<DietaryRequirement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dietary_requirements")
    .select("*")
    .eq("active", true)
    .order("name");
  return (data as DietaryRequirement[]) ?? [];
}

export interface CalendarEvent {
  id: string;
  event_name: string | null;
  event_date: string;
  start_time: string | null;
  venue_name: string | null;
  status: QuoteStatus;
  client_name: string;
}

/**
 * Lightweight event list for the sidebar calendar widget — only the fields
 * needed to render dots/tooltips, so it stays fast on every page load.
 * Excludes Rejected/Cancelled (archived, no longer real events).
 */
export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("id, event_name, event_date, start_time, venue_name, status, client:clients(contact_name)")
    .not("event_date", "is", null)
    .not("status", "in", "(rejected,cancelled)");

  return ((data as unknown as Array<Record<string, unknown>>) ?? []).map((row) => ({
    id: row.id as string,
    event_name: row.event_name as string | null,
    event_date: row.event_date as string,
    start_time: row.start_time as string | null,
    venue_name: row.venue_name as string | null,
    status: row.status as QuoteStatus,
    client_name: (row.client as { contact_name: string } | null)?.contact_name ?? "Unknown",
  }));
}

export interface TrackingReportFilters {
  dateFrom?: string;
  dateTo?: string;
  eventDateFrom?: string;
  eventDateTo?: string;
  status?: QuoteStatus;
  assignedStaffId?: string;
  enquirySource?: string;
  eventType?: string;
  deliveryRegion?: string;
  client?: string;
  lostReason?: string;
  cancellationReason?: string;
}

export interface TrackingReportRow extends QuoteWithTotals {
  assigned_staff_name: string | null;
}

export interface CountBucket {
  label: string;
  count: number;
}

export interface TrackingReport {
  rows: TrackingReportRow[];
  totalEnquiries: number;
  confirmedCount: number;
  lostCount: number;
  cancelledCount: number;
  conversionRatePercent: number;
  totalEstimatedEnquiryValueCents: number;
  confirmedValueCents: number;
  lostValueCents: number;
  cancelledValueCents: number;
  topLostReasons: CountBucket[];
  topCancellationReasons: CountBucket[];
  bySource: CountBucket[];
  byStaff: CountBucket[];
  byLocation: CountBucket[];
  byMonth: CountBucket[];
  averageDaysToConfirmation: number | null;
}

function topN(items: (string | null)[], n = 5): CountBucket[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const label = item?.trim() || "Not Recorded";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export async function getTrackingReport(filters: TrackingReportFilters): Promise<TrackingReport> {
  const supabase = await createClient();

  let query = supabase.from("quotes").select("*, client:clients(*), staff:staff_members(full_name)");

  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
  if (filters.eventDateFrom) query = query.gte("event_date", filters.eventDateFrom);
  if (filters.eventDateTo) query = query.lte("event_date", filters.eventDateTo);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.assignedStaffId) query = query.eq("assigned_staff_id", filters.assignedStaffId);
  if (filters.enquirySource) query = query.eq("enquiry_source", filters.enquirySource);
  if (filters.eventType) query = query.eq("event_type", filters.eventType);
  if (filters.deliveryRegion) query = query.eq("delivery_region", filters.deliveryRegion);
  if (filters.lostReason) query = query.eq("lost_reason", filters.lostReason);
  if (filters.cancellationReason) query = query.eq("cancellation_reason", filters.cancellationReason);

  const { data } = await query;
  let quotes = (data as Array<QuoteWithClient & { staff: { full_name: string } | null }>) ?? [];

  if (filters.client?.trim()) {
    const q = filters.client.trim().toLowerCase();
    quotes = quotes.filter(
      (quote) =>
        quote.client.contact_name.toLowerCase().includes(q) ||
        quote.client.organisation?.toLowerCase().includes(q),
    );
  }

  const withTotals = await attachTotals(supabase, quotes);
  const rows: TrackingReportRow[] = withTotals.map((row, idx) => ({
    ...row,
    assigned_staff_name: quotes[idx]?.staff?.full_name ?? null,
  }));

  const confirmed = rows.filter((r) => r.status === "confirmed" || r.status === "completed");
  const lost = rows.filter((r) => r.status === "rejected");
  const cancelled = rows.filter((r) => r.status === "cancelled");

  const confirmationDurations = confirmed
    .filter((r) => r.confirmed_at)
    .map((r) => {
      const created = new Date(r.created_at).getTime();
      const confirmedAt = new Date(r.confirmed_at as string).getTime();
      return (confirmedAt - created) / (1000 * 60 * 60 * 24);
    })
    .filter((days) => Number.isFinite(days) && days >= 0);

  return {
    rows,
    totalEnquiries: rows.length,
    confirmedCount: confirmed.length,
    lostCount: lost.length,
    cancelledCount: cancelled.length,
    conversionRatePercent: rows.length > 0 ? (confirmed.length / rows.length) * 100 : 0,
    totalEstimatedEnquiryValueCents: rows.reduce((sum, r) => sum + (r.estimated_event_value_cents ?? 0), 0),
    confirmedValueCents: confirmed.reduce((sum, r) => sum + r.totalIncGstCents, 0),
    lostValueCents: lost.reduce((sum, r) => sum + r.totalIncGstCents, 0),
    cancelledValueCents: cancelled.reduce((sum, r) => sum + r.totalIncGstCents, 0),
    topLostReasons: topN(lost.map((r) => r.lost_reason)),
    topCancellationReasons: topN(cancelled.map((r) => r.cancellation_reason)),
    bySource: topN(rows.map((r) => r.enquiry_source), 10),
    byStaff: topN(rows.map((r) => r.assigned_staff_name), 10),
    byLocation: topN(rows.map((r) => r.delivery_region), 10),
    byMonth: topN(rows.map((r) => r.event_date?.slice(0, 7) ?? null), 12),
    averageDaysToConfirmation:
      confirmationDurations.length > 0
        ? confirmationDurations.reduce((a, b) => a + b, 0) / confirmationDurations.length
        : null,
  };
}
