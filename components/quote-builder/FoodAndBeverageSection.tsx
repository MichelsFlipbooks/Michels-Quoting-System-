"use client";

import { Card } from "@/components/ui/Card";
import type { CatalogueItem, DietaryRequirement } from "@/lib/types";
import type { PackageWithSelections } from "@/lib/queries";
import { BeverageConsumptionSection } from "./BeverageConsumptionSection";
import { LineItemSection } from "./LineItemSection";
import { PackagePicker } from "./PackagePicker";
import type { DraftDietary, DraftLineItem } from "./state";

export function FoodAndBeverageSection({
  packages,
  catalogueItems,
  guestNumbers,
  lineItems,
  onChange,
  dietaryOptions,
  dietaryRequirements,
  onDietaryChange,
}: {
  packages: PackageWithSelections[];
  catalogueItems: CatalogueItem[];
  guestNumbers: number | null;
  lineItems: DraftLineItem[];
  onChange: (items: DraftLineItem[]) => void;
  dietaryOptions: DietaryRequirement[];
  dietaryRequirements: DraftDietary[];
  onDietaryChange: (dietary: DraftDietary[]) => void;
}) {
  function toggleDietary(id: string) {
    const exists = dietaryRequirements.find((d) => d.dietaryRequirementId === id);
    if (exists) {
      onDietaryChange(dietaryRequirements.filter((d) => d.dietaryRequirementId !== id));
    } else {
      onDietaryChange([...dietaryRequirements, { dietaryRequirementId: id, guestCount: null, notes: "" }]);
    }
  }

  function updateDietaryCount(id: string, guestCount: number | null) {
    onDietaryChange(
      dietaryRequirements.map((d) => (d.dietaryRequirementId === id ? { ...d, guestCount } : d)),
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-2 text-lg font-semibold text-navy-dark">Dietaries</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {dietaryOptions.map((option) => {
            const selected = dietaryRequirements.find((d) => d.dietaryRequirementId === option.id);
            return (
              <div key={option.id} className="flex items-center gap-2 rounded-md border border-border-soft p-2">
                <input
                  type="checkbox"
                  id={`dietary-${option.id}`}
                  checked={!!selected}
                  onChange={() => toggleDietary(option.id)}
                  className="h-4 w-4 accent-copper"
                />
                <label htmlFor={`dietary-${option.id}`} className="flex-1 text-sm text-navy-dark">
                  {option.name}
                </label>
                {selected && (
                  <input
                    type="number"
                    min={0}
                    placeholder="Guests"
                    className="w-20 rounded-md border border-border-soft px-2 py-1 text-xs"
                    value={selected.guestCount ?? ""}
                    onChange={(e) =>
                      updateDietaryCount(option.id, e.target.value ? Number(e.target.value) : null)
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-navy-dark">Food and Beverage</h2>

        <PackagePicker
          packages={packages}
          category="food"
          heading="Catering Packages"
          guestNumbers={guestNumbers}
          lineItems={lineItems}
          onChange={onChange}
        />
        <LineItemSection
          section="food"
          lineItems={lineItems}
          catalogueItems={catalogueItems}
          onChange={onChange}
          title="Catering Menus"
          helperText="Individual menu items, add-ons, and custom food lines — reorder and edit freely."
        />

        <div className="my-6 border-t border-border-soft" />

        <PackagePicker
          packages={packages}
          category="beverage"
          heading="Beverage Packages"
          guestNumbers={guestNumbers}
          lineItems={lineItems}
          onChange={onChange}
        />
        <BeverageConsumptionSection catalogueItems={catalogueItems} lineItems={lineItems} onChange={onChange} />
        <LineItemSection
          section="beverage"
          lineItems={lineItems}
          catalogueItems={catalogueItems}
          onChange={onChange}
          title="Other Beverage Lines"
          helperText="Custom beverage lines not covered by a package or on-consumption item above."
        />
      </Card>
    </div>
  );
}
