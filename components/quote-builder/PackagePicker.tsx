"use client";

import { useState } from "react";
import { formatAUD } from "@/lib/format";
import type { PackageWithSelections } from "@/lib/queries";
import { newLineItem, type DraftLineItem } from "./state";

const inputClass =
  "w-full rounded-md border border-border-soft px-2 py-1.5 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper";

export function PackagePicker({
  packages,
  guestNumbers,
  lineItems,
  onChange,
}: {
  packages: PackageWithSelections[];
  guestNumbers: number | null;
  lineItems: DraftLineItem[];
  onChange: (items: DraftLineItem[]) => void;
}) {
  const [choice, setChoice] = useState("");

  function addPackage() {
    const pkg = packages.find((p) => p.id === choice);
    if (!pkg) return;

    const guests = guestNumbers && guestNumbers > 0 ? guestNumbers : 1;
    const maxOrder = Math.max(0, ...lineItems.filter((li) => li.section === "food").map((li) => li.sort_order));

    const packageLine = newLineItem({
      section: "food",
      line_type: "package",
      package_id: pkg.id,
      description: pkg.name,
      internal_description: pkg.description ?? "",
      quantity: pkg.pricing_type === "per_guest" ? guests : 1,
      unit: pkg.pricing_type === "per_guest" ? "guest" : "each",
      unit_price_cents: pkg.pricing_type === "per_guest" ? pkg.price_per_guest_cents ?? 0 : pkg.fixed_price_cents ?? 0,
      sort_order: maxOrder + 1,
    });

    const includedLines = pkg.selections
      .filter((sel) => !sel.is_optional_addon)
      .map((sel, idx) =>
        newLineItem({
          section: "food",
          line_type: "package",
          package_id: pkg.id,
          description: sel.catalogue_item?.name ?? sel.custom_name ?? "Included item",
          internal_description: sel.catalogue_item?.internal_description ?? "",
          quantity: 1,
          unit: "included",
          unit_price_cents: 0,
          internal_cost_cents: sel.catalogue_item?.default_internal_cost_cents ?? 0,
          is_included_selection: true,
          sort_order: maxOrder + 2 + idx,
        }),
      );

    onChange([...lineItems, packageLine, ...includedLines]);
    setChoice("");
  }

  function addAddon(pkg: PackageWithSelections, selection: PackageWithSelections["selections"][number]) {
    const maxOrder = Math.max(0, ...lineItems.filter((li) => li.section === "food").map((li) => li.sort_order));
    onChange([
      ...lineItems,
      newLineItem({
        section: "food",
        line_type: "package",
        package_id: pkg.id,
        description: `${selection.catalogue_item?.name ?? selection.custom_name} (add-on)`,
        internal_description: selection.catalogue_item?.internal_description ?? "",
        quantity: 1,
        unit: selection.catalogue_item?.default_unit ?? "each",
        unit_price_cents: selection.addon_price_cents ?? selection.catalogue_item?.default_unit_price_cents ?? 0,
        internal_cost_cents: selection.catalogue_item?.default_internal_cost_cents ?? 0,
        is_addon: true,
        sort_order: maxOrder + 1,
      }),
    ]);
  }

  const selectedPackage = packages.find((p) => p.id === choice);

  return (
    <div className="mb-6 rounded-lg border border-copper/30 bg-copper/5 p-4">
      <h3 className="mb-2 text-sm font-semibold text-navy-dark">Catering Packages</h3>
      <div className="flex flex-wrap items-center gap-2">
        <select className={`${inputClass} max-w-xs`} value={choice} onChange={(e) => setChoice(e.target.value)}>
          <option value="">Select a package…</option>
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name} —{" "}
              {pkg.pricing_type === "per_guest"
                ? `${formatAUD(pkg.price_per_guest_cents ?? 0)}/guest`
                : formatAUD(pkg.fixed_price_cents ?? 0)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addPackage}
          disabled={!choice}
          className="rounded-md bg-copper px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          Add Package
        </button>
      </div>

      {selectedPackage && (
        <div className="mt-3 text-sm text-navy-dark/70">
          <p className="mb-1 font-medium">Included:</p>
          <ul className="list-inside list-disc">
            {selectedPackage.selections
              .filter((s) => !s.is_optional_addon)
              .map((s) => (
                <li key={s.id}>{s.catalogue_item?.name ?? s.custom_name}</li>
              ))}
          </ul>
          {selectedPackage.selections.some((s) => s.is_optional_addon) && (
            <>
              <p className="mt-2 mb-1 font-medium">Optional add-ons (added once the package is on the quote):</p>
              <ul className="list-inside list-disc">
                {selectedPackage.selections
                  .filter((s) => s.is_optional_addon)
                  .map((s) => (
                    <li key={s.id}>
                      {s.catalogue_item?.name ?? s.custom_name} — {formatAUD(s.addon_price_cents ?? 0)}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>
      )}

      {lineItems.some((li) => li.package_id) && (
        <div className="mt-4 border-t border-copper/20 pt-3">
          <p className="mb-2 text-sm font-medium text-navy-dark">Add an optional add-on to a package already on this quote:</p>
          <div className="flex flex-wrap gap-2">
            {packages
              .filter((pkg) => lineItems.some((li) => li.package_id === pkg.id && !li.is_included_selection && !li.is_addon))
              .flatMap((pkg) =>
                pkg.selections
                  .filter((s) => s.is_optional_addon)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addAddon(pkg, s)}
                      className="rounded-full border border-copper px-3 py-1 text-xs font-medium text-copper-dark hover:bg-copper/10"
                    >
                      + {s.catalogue_item?.name ?? s.custom_name} ({formatAUD(s.addon_price_cents ?? 0)})
                    </button>
                  )),
              )}
          </div>
        </div>
      )}
    </div>
  );
}
