"use client";

import { Card } from "@/components/ui/Card";
import { CLIENT_STAFFING_NOTE } from "@/lib/constants";
import { formatAUD } from "@/lib/format";
import { recommendStaffing } from "@/lib/staffing-recommendation";
import type { CatalogueItem } from "@/lib/types";
import { LineItemSection } from "./LineItemSection";
import { newLineItem, type DraftLineItem } from "./state";

export function StaffingSection({
  lineItems,
  catalogueItems,
  onChange,
  serviceLevel,
  guestNumbers,
  startTime,
  finishTime,
  travelMinutesEachWay,
  venueTravelDurationMinutes,
  onTravelMinutesChange,
}: {
  lineItems: DraftLineItem[];
  catalogueItems: CatalogueItem[];
  onChange: (items: DraftLineItem[]) => void;
  serviceLevel: string;
  guestNumbers: number | null;
  startTime: string;
  finishTime: string;
  travelMinutesEachWay: number | null;
  venueTravelDurationMinutes: number | null;
  onTravelMinutesChange: (minutes: number | null) => void;
}) {
  const beverageServiceRequired = lineItems.some((li) => li.section === "beverage" && li.quantity > 0);
  const staffCatalogue = catalogueItems.filter((ci) => ci.category === "staffing");
  const effectiveTravelMinutes = travelMinutesEachWay ?? venueTravelDurationMinutes;

  function autoRecommend() {
    const recommendations = recommendStaffing({
      serviceLevel,
      guestNumbers: guestNumbers ?? 0,
      beverageServiceRequired,
      startTime: startTime || null,
      finishTime: finishTime || null,
      travelMinutesEachWay: effectiveTravelMinutes,
    });

    const nonStaffing = lineItems.filter((li) => li.section !== "staffing");
    const recommendedLines = recommendations.map((rec, idx) => {
      const catalogueMatch = staffCatalogue.find((ci) => ci.name === rec.roleName);
      return newLineItem({
        section: "staffing",
        line_type: catalogueMatch ? "catalogue_item" : "custom",
        catalogue_item_id: catalogueMatch?.id ?? null,
        description: rec.roleName,
        internal_description: catalogueMatch?.internal_description ?? "",
        quantity: rec.staffCount,
        unit: "hour",
        unit_price_cents: catalogueMatch?.default_unit_price_cents ?? 0,
        internal_cost_cents: catalogueMatch?.default_internal_cost_cents ?? 0,
        hours: rec.hours,
        gst_status: catalogueMatch?.default_gst_status ?? "gst_applicable",
        sort_order: idx,
      });
    });

    onChange([...nonStaffing, ...recommendedLines]);
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-lg font-semibold text-navy-dark">Staffing</h2>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-navy-dark">Travel Time to Venue (mins, one-way)</span>
          <input
            type="number"
            min={0}
            className="w-56 rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper"
            placeholder={venueTravelDurationMinutes != null ? String(venueTravelDurationMinutes) : "e.g. 30"}
            value={travelMinutesEachWay ?? ""}
            onChange={(e) => onTravelMinutesChange(e.target.value ? Number(e.target.value) : null)}
          />
          {venueTravelDurationMinutes != null && travelMinutesEachWay == null && (
            <span className="mt-1 block text-xs text-navy-dark/50">
              Defaulting to ~{venueTravelDurationMinutes} min from the venue address on Customer &amp; Event Details.
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={autoRecommend}
          disabled={!serviceLevel || !guestNumbers}
          className="rounded-md bg-navy px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          title={!serviceLevel || !guestNumbers ? "Set Service Level and Guest Numbers in Customer & Event Details first" : ""}
        >
          Auto-Recommend Staffing
        </button>
      </div>

      {staffCatalogue.length > 0 && (
        <div className="mb-4 rounded-md border border-border-soft bg-cream p-3 text-xs text-navy-dark/70">
          <p className="mb-1 font-semibold text-navy-dark/80">Current staffing rates (from the catalogue):</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {staffCatalogue.map((ci) => (
              <span key={ci.id}>
                {ci.name}: {formatAUD(ci.default_unit_price_cents)}/hr
              </span>
            ))}
          </div>
        </div>
      )}

      <LineItemSection
        section="staffing"
        lineItems={lineItems}
        catalogueItems={catalogueItems}
        onChange={onChange}
        title=""
      />

      <div className="mt-4 rounded-md bg-cream p-3 text-sm text-navy-dark/80">
        <p className="font-medium">This note appears on the client-facing quote:</p>
        <p className="mt-1 italic">&ldquo;{CLIENT_STAFFING_NOTE}&rdquo;</p>
      </div>
    </Card>
  );
}
