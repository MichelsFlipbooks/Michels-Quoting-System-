"use client";

import { formatAUD } from "@/lib/format";
import type { CatalogueItem } from "@/lib/types";
import { newLineItem, type DraftLineItem } from "./state";

const CONSUMPTION_UNIT = "on consumption";

export function BeverageConsumptionSection({
  catalogueItems,
  lineItems,
  onChange,
}: {
  catalogueItems: CatalogueItem[];
  lineItems: DraftLineItem[];
  onChange: (items: DraftLineItem[]) => void;
}) {
  const beverageCatalogue = catalogueItems.filter((ci) => ci.category === "beverage");

  function isSelected(item: CatalogueItem) {
    return lineItems.some(
      (li) => li.catalogue_item_id === item.id && li.section === "beverage" && li.unit === CONSUMPTION_UNIT,
    );
  }

  function toggle(item: CatalogueItem) {
    if (isSelected(item)) {
      onChange(
        lineItems.filter(
          (li) => !(li.catalogue_item_id === item.id && li.section === "beverage" && li.unit === CONSUMPTION_UNIT),
        ),
      );
      return;
    }
    const maxOrder = Math.max(0, ...lineItems.filter((li) => li.section === "beverage").map((li) => li.sort_order));
    onChange([
      ...lineItems,
      newLineItem({
        section: "beverage",
        line_type: "catalogue_item",
        catalogue_item_id: item.id,
        description: `${item.name} (on consumption)`,
        internal_description: item.internal_description ?? "",
        quantity: 1,
        unit: CONSUMPTION_UNIT,
        unit_price_cents: item.default_unit_price_cents,
        internal_cost_cents: item.default_internal_cost_cents,
        gst_status: item.default_gst_status,
        sort_order: maxOrder + 1,
      }),
    ]);
  }

  if (beverageCatalogue.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-copper/30 bg-copper/5 p-4">
      <h3 className="mb-1 text-sm font-semibold text-navy-dark">Beverage on Consumption</h3>
      <p className="mb-3 text-xs text-navy-dark/60">
        Tick the beverages available on a bar tab — billed by what&apos;s actually consumed, confirmed after the
        event. Reference price shown is per unit.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {beverageCatalogue.map((item) => {
          const selected = isSelected(item);
          return (
            <label
              key={item.id}
              className="flex items-center gap-2 rounded-md border border-border-soft bg-white p-2 text-sm"
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggle(item)}
                className="h-4 w-4 accent-copper"
              />
              <span className="flex-1 text-navy-dark">{item.name}</span>
              <span className="text-xs text-navy-dark/60">
                {formatAUD(item.default_unit_price_cents)}/{item.default_unit}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
