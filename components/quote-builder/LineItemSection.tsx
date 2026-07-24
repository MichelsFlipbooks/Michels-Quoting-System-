"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { formatAUD } from "@/lib/format";
import { lineItemTotalCents } from "@/lib/calculations";
import { GST_STATUSES, GST_STATUS_LABELS, LINE_ITEM_SECTION_LABELS, UNIT_SUGGESTIONS, type LineItemSection as SectionKey } from "@/lib/constants";
import type { CatalogueItem } from "@/lib/types";
import { newLineItem, type DraftLineItem } from "./state";

const inputClass =
  "w-full rounded-md border border-border-soft px-2 py-1.5 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper";

export function LineItemSection({
  section,
  lineItems,
  catalogueItems,
  onChange,
  title,
  helperText,
}: {
  section: SectionKey;
  lineItems: DraftLineItem[];
  catalogueItems: CatalogueItem[];
  onChange: (items: DraftLineItem[]) => void;
  title?: string;
  helperText?: string;
}) {
  const [catalogueChoice, setCatalogueChoice] = useState("");
  const sectionItems = lineItems.filter((li) => li.section === section);
  const otherItems = lineItems.filter((li) => li.section !== section);
  const sectionCatalogue = catalogueItems.filter((ci) => ci.category === section);

  function commit(nextSectionItems: DraftLineItem[]) {
    onChange([...otherItems, ...nextSectionItems]);
  }

  function addFromCatalogue() {
    const item = sectionCatalogue.find((ci) => ci.id === catalogueChoice);
    if (!item) return;
    const maxOrder = Math.max(0, ...sectionItems.map((li) => li.sort_order));
    commit([
      ...sectionItems,
      newLineItem({
        section,
        line_type: "catalogue_item",
        catalogue_item_id: item.id,
        description: item.name,
        internal_description: item.internal_description ?? "",
        unit: item.default_unit,
        unit_price_cents: item.default_unit_price_cents,
        internal_cost_cents: item.default_internal_cost_cents,
        gst_status: item.default_gst_status,
        sort_order: maxOrder + 1,
        hours: section === "staffing" ? 1 : null,
        quantity: 1,
      }),
    ]);
    setCatalogueChoice("");
  }

  function addCustom() {
    const maxOrder = Math.max(0, ...sectionItems.map((li) => li.sort_order));
    commit([
      ...sectionItems,
      newLineItem({
        section,
        line_type: "custom",
        description: "",
        sort_order: maxOrder + 1,
        hours: section === "staffing" ? 1 : null,
      }),
    ]);
  }

  function update(localId: string, fields: Partial<DraftLineItem>) {
    commit(sectionItems.map((li) => (li.localId === localId ? { ...li, ...fields } : li)));
  }

  function remove(localId: string) {
    commit(sectionItems.filter((li) => li.localId !== localId));
  }

  function move(localId: string, direction: -1 | 1) {
    const sorted = [...sectionItems].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((li) => li.localId === localId);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    commit(
      sectionItems.map((li) => {
        if (li.localId === a.localId) return { ...li, sort_order: b.sort_order };
        if (li.localId === b.localId) return { ...li, sort_order: a.sort_order };
        return li;
      }),
    );
  }

  const sorted = [...sectionItems].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-navy-dark">{title ?? LINE_ITEM_SECTION_LABELS[section]}</h3>
      </div>
      {helperText && <p className="mb-3 text-sm text-navy-dark/60">{helperText}</p>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          className={clsx(inputClass, "max-w-xs")}
          value={catalogueChoice}
          onChange={(e) => setCatalogueChoice(e.target.value)}
        >
          <option value="">Add from catalogue…</option>
          {sectionCatalogue.map((ci) => (
            <option key={ci.id} value={ci.id}>
              {ci.name} ({formatAUD(ci.default_unit_price_cents)}/{ci.default_unit})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addFromCatalogue}
          disabled={!catalogueChoice}
          className="rounded-md bg-navy px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          Add
        </button>
        <button
          type="button"
          onClick={addCustom}
          className="rounded-md border border-copper px-3 py-1.5 text-sm font-medium text-copper-dark hover:bg-copper/10"
        >
          + Add Custom Line
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-navy-dark/50">No lines added yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-soft">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs font-semibold uppercase tracking-wide text-navy-dark/70">
              <tr>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Internal Description</th>
                <th className="px-3 py-2 w-20">{section === "staffing" ? "Staff" : "Qty"}</th>
                {section === "staffing" && <th className="px-3 py-2 w-20">Hours</th>}
                <th className="px-3 py-2 w-24">Unit</th>
                <th className="px-3 py-2 w-28">{section === "staffing" ? "Hourly Rate" : "Unit Price"}</th>
                <th className="px-3 py-2 w-32">GST</th>
                <th className="px-3 py-2 w-28">Internal Cost</th>
                <th className="px-3 py-2 w-28 text-right">Total</th>
                <th className="px-3 py-2 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {sorted.map((li, idx) => (
                <tr key={li.localId} className={li.is_included_selection ? "bg-cream/50" : undefined}>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      className={inputClass}
                      value={li.description}
                      onChange={(e) => update(li.localId, { description: e.target.value })}
                    />
                    {li.is_included_selection && (
                      <span className="mt-1 block text-xs text-copper-dark">Included package selection</span>
                    )}
                    {li.is_addon && <span className="mt-1 block text-xs text-copper-dark">Optional add-on</span>}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      className={inputClass}
                      value={li.internal_description}
                      onChange={(e) => update(li.localId, { internal_description: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={li.quantity}
                      onChange={(e) => update(li.localId, { quantity: Number(e.target.value) })}
                    />
                  </td>
                  {section === "staffing" && (
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.25"
                        className={inputClass}
                        value={li.hours ?? 0}
                        onChange={(e) => update(li.localId, { hours: Number(e.target.value) })}
                      />
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      list="unit-suggestions"
                      className={inputClass}
                      value={li.unit}
                      onChange={(e) => update(li.localId, { unit: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={li.unit_price_cents / 100}
                      onChange={(e) => update(li.localId, { unit_price_cents: Math.round(Number(e.target.value) * 100) })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className={inputClass}
                      value={li.gst_status}
                      onChange={(e) => update(li.localId, { gst_status: e.target.value as DraftLineItem["gst_status"] })}
                    >
                      {GST_STATUSES.map((g) => (
                        <option key={g} value={g}>
                          {GST_STATUS_LABELS[g]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={li.internal_cost_cents / 100}
                      onChange={(e) => update(li.localId, { internal_cost_cents: Math.round(Number(e.target.value) * 100) })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-navy-dark">
                    {formatAUD(lineItemTotalCents(li))}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => move(li.localId, -1)}
                        disabled={idx === 0}
                        className="rounded px-1.5 py-1 text-navy-dark/60 hover:bg-cream disabled:opacity-30"
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(li.localId, 1)}
                        disabled={idx === sorted.length - 1}
                        className="rounded px-1.5 py-1 text-navy-dark/60 hover:bg-cream disabled:opacity-30"
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(li.localId)}
                        className="rounded px-1.5 py-1 text-red-700 hover:bg-red-50"
                        aria-label="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <datalist id="unit-suggestions">
        {UNIT_SUGGESTIONS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
    </div>
  );
}
