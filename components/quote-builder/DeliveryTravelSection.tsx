"use client";

import { Card } from "@/components/ui/Card";
import {
  DELIVERY_REGIONS,
  DELIVERY_REGION_LABELS,
  REMOTE_DELIVERY_REGIONS,
  VEHICLE_TYPE_SUGGESTIONS,
  type DeliveryRegion,
} from "@/lib/constants";
import type { QuoteDraft } from "./state";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-navy-dark">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper";

type Patch = Partial<QuoteDraft>;

export function DeliveryTravelSection({
  draft,
  onChange,
}: {
  draft: QuoteDraft;
  onChange: (fields: Patch) => void;
}) {
  function handleRegionChange(region: string) {
    const patch: Patch = { deliveryRegion: region };
    // Suggest (don't force) accommodation/overnight for remote regions.
    if (
      REMOTE_DELIVERY_REGIONS.includes(region as DeliveryRegion) &&
      !draft.accommodationRequired &&
      !draft.overnightTravelRequired
    ) {
      patch.accommodationRequired = true;
      patch.overnightTravelRequired = true;
    }
    onChange(patch);
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-navy-dark">Delivery & Travel</h2>
      <p className="mb-4 text-sm text-navy-dark/60">
        Logistics for Michels Catering's Townsville production kitchen. All values here are editable — use them
        as planning info alongside the priced delivery/travel line items below.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Delivery Region">
          <select
            className={inputClass}
            value={draft.deliveryRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
          >
            <option value="">Select…</option>
            {DELIVERY_REGIONS.map((r) => (
              <option key={r} value={r}>
                {DELIVERY_REGION_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Delivery Date">
          <input
            type="date"
            className={inputClass}
            value={draft.deliveryDate}
            onChange={(e) => onChange({ deliveryDate: e.target.value })}
          />
        </Field>

        <Field label="Required Arrival Time">
          <input
            type="time"
            className={inputClass}
            value={draft.requiredArrivalTime}
            onChange={(e) => onChange({ requiredArrivalTime: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Delivery Window Start">
            <input
              type="time"
              className={inputClass}
              value={draft.deliveryWindowStart}
              onChange={(e) => onChange({ deliveryWindowStart: e.target.value })}
            />
          </Field>
          <Field label="Delivery Window End">
            <input
              type="time"
              className={inputClass}
              value={draft.deliveryWindowEnd}
              onChange={(e) => onChange({ deliveryWindowEnd: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Travel Distance from Kitchen (km)">
          <input
            type="number"
            min={0}
            step="0.1"
            className={inputClass}
            value={draft.venueTravelDistanceKm ?? ""}
            onChange={(e) => onChange({ venueTravelDistanceKm: e.target.value ? Number(e.target.value) : null })}
          />
        </Field>

        <Field label="Estimated Travel Time (minutes)">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={draft.venueTravelDurationMinutes ?? ""}
            onChange={(e) =>
              onChange({ venueTravelDurationMinutes: e.target.value ? Number(e.target.value) : null })
            }
          />
        </Field>

        <Field label="Return Travel Time (minutes)">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={draft.returnTravelDurationMinutes ?? ""}
            onChange={(e) =>
              onChange({ returnTravelDurationMinutes: e.target.value ? Number(e.target.value) : null })
            }
          />
        </Field>

        <Field label="Staff Travel Time (minutes)">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={draft.staffTravelTimeMinutes ?? ""}
            onChange={(e) => onChange({ staffTravelTimeMinutes: e.target.value ? Number(e.target.value) : null })}
          />
        </Field>

        <Field label="Number of Vehicles">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={draft.vehicleCount ?? ""}
            onChange={(e) => onChange({ vehicleCount: e.target.value ? Number(e.target.value) : null })}
          />
        </Field>

        <Field label="Vehicle Type">
          <input
            type="text"
            list="vehicle-type-suggestions"
            className={inputClass}
            value={draft.vehicleType}
            onChange={(e) => onChange({ vehicleType: e.target.value })}
          />
          <datalist id="vehicle-type-suggestions">
            {VEHICLE_TYPE_SUGGESTIONS.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </Field>

        <Field label="Fuel / Travel Charge (AUD)">
          <input
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            value={draft.fuelTravelChargeCents != null ? draft.fuelTravelChargeCents / 100 : ""}
            onChange={(e) =>
              onChange({ fuelTravelChargeCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null })
            }
          />
        </Field>

        <Field label="Ferry / Toll / Parking Costs (AUD)">
          <input
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            value={draft.ferryTollParkingCostCents != null ? draft.ferryTollParkingCostCents / 100 : ""}
            onChange={(e) =>
              onChange({
                ferryTollParkingCostCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null,
              })
            }
          />
        </Field>

        <Field label="Regional / Remote Surcharge (AUD)">
          <input
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            value={draft.regionalSurchargeCents != null ? draft.regionalSurchargeCents / 100 : ""}
            onChange={(e) =>
              onChange({
                regionalSurchargeCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null,
              })
            }
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-navy-dark">
          <input
            type="checkbox"
            checked={draft.driverRequired}
            onChange={(e) => onChange({ driverRequired: e.target.checked })}
            className="h-4 w-4 accent-copper"
          />
          Driver Required
        </label>
        <label className="flex items-center gap-2 text-sm text-navy-dark">
          <input
            type="checkbox"
            checked={draft.accommodationRequired}
            onChange={(e) => onChange({ accommodationRequired: e.target.checked })}
            className="h-4 w-4 accent-copper"
          />
          Accommodation Required
        </label>
        <label className="flex items-center gap-2 text-sm text-navy-dark">
          <input
            type="checkbox"
            checked={draft.overnightTravelRequired}
            onChange={(e) => onChange({ overnightTravelRequired: e.target.checked })}
            className="h-4 w-4 accent-copper"
          />
          Overnight Travel Required
        </label>
      </div>

      <div className="mt-4">
        <Field label="Notes & Special Instructions">
          <textarea
            className={inputClass}
            rows={3}
            value={draft.deliveryNotes}
            onChange={(e) => onChange({ deliveryNotes: e.target.value })}
          />
        </Field>
      </div>
    </Card>
  );
}
