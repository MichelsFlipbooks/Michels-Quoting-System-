"use client";

import { Card } from "@/components/ui/Card";
import { CLIENT_STAFFING_NOTE } from "@/lib/constants";
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
}: {
  lineItems: DraftLineItem[];
  catalogueItems: CatalogueItem[];
  onChange: (items: DraftLineItem[]) => void;
  serviceLevel: string;
  guestNumbers: number | null;
  startTime: string;
  finishTime: string;
}) {
  const beverageServiceRequired = lineItems.some((li) => li.section === "beverage" && li.quantity > 0);
  const staffCatalogue = catalogueItems.filter((ci) => ci.category === "staffing");

  function autoRecommend() {
    const recommendations = recommendStaffing({
      serviceLevel,
      guestNumbers: guestNumbers ?? 0,
      beverageServiceRequired,
      startTime: startTime || null,
      finishTime: finishTime || null,
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-dark">Staffing</h2>
        <button
          type="button"
          onClick={autoRecommend}
          disabled={!serviceLevel || !guestNumbers}
          className="rounded-md bg-navy px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          title={!serviceLevel || !guestNumbers ? "Set Service Level and Guest Numbers in Event Details first" : ""}
        >
          Auto-Recommend Staffing
        </button>
      </div>

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
