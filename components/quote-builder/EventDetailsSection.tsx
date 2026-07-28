"use client";

import { Card } from "@/components/ui/Card";
import { EVENT_TYPES, SERVICE_LEVELS } from "@/lib/constants";
import { getDistanceFromKitchen } from "@/lib/maps";
import type { DietaryRequirement } from "@/lib/types";
import { TimelineEditor } from "./TimelineEditor";
import { VenueAddressAutocomplete, type ParsedVenueAddress } from "./VenueAddressAutocomplete";
import type { DraftDietary, DraftTimelineItem, QuoteDraft } from "./state";

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

export function EventDetailsSection({
  draft,
  onChange,
  dietaryOptions,
  onDietaryChange,
  onTimelineChange,
}: {
  draft: QuoteDraft;
  onChange: (fields: Patch) => void;
  dietaryOptions: DietaryRequirement[];
  onDietaryChange: (dietary: DraftDietary[]) => void;
  onTimelineChange: (items: DraftTimelineItem[]) => void;
}) {
  function toggleDietary(id: string) {
    const exists = draft.dietaryRequirements.find((d) => d.dietaryRequirementId === id);
    if (exists) {
      onDietaryChange(draft.dietaryRequirements.filter((d) => d.dietaryRequirementId !== id));
    } else {
      onDietaryChange([...draft.dietaryRequirements, { dietaryRequirementId: id, guestCount: null, notes: "" }]);
    }
  }

  function updateDietaryCount(id: string, guestCount: number | null) {
    onDietaryChange(
      draft.dietaryRequirements.map((d) => (d.dietaryRequirementId === id ? { ...d, guestCount } : d)),
    );
  }

  async function handleVenueSelect(address: ParsedVenueAddress) {
    onChange({
      venueAddress: address.formattedAddress,
      venuePlaceId: address.placeId,
      venueLat: address.lat,
      venueLng: address.lng,
      venueStreetAddress: address.streetAddress,
      venueSuburb: address.suburb,
      venueState: address.state,
      venuePostcode: address.postcode,
    });

    const distance = await getDistanceFromKitchen(address.lat, address.lng);
    if (!distance.error) {
      onChange({
        venueTravelDistanceKm: distance.distanceKm,
        venueTravelDurationMinutes: distance.durationMinutes,
      });
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-navy-dark">Event Details</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Event Name">
          <input
            type="text"
            className={inputClass}
            value={draft.eventName}
            onChange={(e) => onChange({ eventName: e.target.value })}
          />
        </Field>

        <Field label="Event Type">
          <select
            className={inputClass}
            value={draft.eventType}
            onChange={(e) => onChange({ eventType: e.target.value })}
          >
            <option value="">Select…</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Service Level">
          <select
            className={inputClass}
            value={draft.serviceLevel}
            onChange={(e) => onChange({ serviceLevel: e.target.value })}
          >
            <option value="">Select…</option>
            {SERVICE_LEVELS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Guest Numbers">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={draft.guestNumbers ?? ""}
            onChange={(e) => onChange({ guestNumbers: e.target.value ? Number(e.target.value) : null })}
          />
        </Field>

        <Field label="Event Date">
          <input
            type="date"
            className={inputClass}
            value={draft.eventDate}
            onChange={(e) => onChange({ eventDate: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Time">
            <input
              type="time"
              className={inputClass}
              value={draft.startTime}
              onChange={(e) => onChange({ startTime: e.target.value })}
            />
          </Field>
          <Field label="Finish Time">
            <input
              type="time"
              className={inputClass}
              value={draft.finishTime}
              onChange={(e) => onChange({ finishTime: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Venue Name">
          <input
            type="text"
            className={inputClass}
            value={draft.venueName}
            onChange={(e) => onChange({ venueName: e.target.value })}
          />
        </Field>

        <Field label="Venue Address">
          <VenueAddressAutocomplete
            value={draft.venueAddress}
            onChange={(venueAddress) => onChange({ venueAddress })}
            onSelect={handleVenueSelect}
          />
          {(draft.venueLat != null || draft.venueTravelDistanceKm != null) && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-navy-dark/60">
              {draft.venueTravelDistanceKm != null && draft.venueTravelDurationMinutes != null && (
                <span>
                  ~{draft.venueTravelDistanceKm} km · ~{draft.venueTravelDurationMinutes} min from the Townsville
                  kitchen
                </span>
              )}
              {draft.venueLat != null && draft.venueLng != null && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${draft.venueLat},${draft.venueLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-copper hover:underline"
                >
                  Open in Google Maps →
                </a>
              )}
            </div>
          )}
        </Field>

        <div className="col-span-full flex items-center gap-2 rounded-md border border-border-soft bg-cream p-3">
          <input
            type="checkbox"
            id="event-contact-same-as-client"
            checked={draft.eventContactSameAsClient}
            onChange={(e) => onChange({ eventContactSameAsClient: e.target.checked })}
            className="h-4 w-4 accent-copper"
          />
          <label htmlFor="event-contact-same-as-client" className="text-sm font-medium text-navy-dark">
            Event contact is the same as the client contact
          </label>
        </div>

        <Field label="Event Contact Name">
          <input
            type="text"
            className={inputClass}
            disabled={draft.eventContactSameAsClient}
            value={draft.eventContactSameAsClient ? draft.client.contact_name : draft.eventContactName}
            onChange={(e) => onChange({ eventContactName: e.target.value })}
          />
        </Field>

        <Field label="Event Contact Phone">
          <input
            type="tel"
            className={inputClass}
            disabled={draft.eventContactSameAsClient}
            value={draft.eventContactSameAsClient ? draft.client.phone ?? "" : draft.eventContactPhone}
            onChange={(e) => onChange({ eventContactPhone: e.target.value })}
          />
        </Field>

        <Field label="Event Contact Email">
          <input
            type="email"
            className={inputClass}
            disabled={draft.eventContactSameAsClient}
            value={draft.eventContactSameAsClient ? draft.client.email ?? "" : draft.eventContactEmail}
            onChange={(e) => onChange({ eventContactEmail: e.target.value })}
          />
        </Field>

        <Field label="Event Contact Role at Event">
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Bride, Venue Coordinator, HR Manager"
            value={draft.eventContactRole}
            onChange={(e) => onChange({ eventContactRole: e.target.value })}
          />
        </Field>

        <Field label="Client Budget (AUD)">
          <input
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            value={draft.clientBudgetCents != null ? draft.clientBudgetCents / 100 : ""}
            onChange={(e) =>
              onChange({ clientBudgetCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null })
            }
          />
        </Field>

        <Field label="Access Notes">
          <textarea
            className={inputClass}
            rows={2}
            value={draft.accessNotes}
            onChange={(e) => onChange({ accessNotes: e.target.value })}
          />
        </Field>

        <Field label="Parking & Loading Details">
          <textarea
            className={inputClass}
            rows={2}
            value={draft.parkingLoadingDetails}
            onChange={(e) => onChange({ parkingLoadingDetails: e.target.value })}
          />
        </Field>

        <Field label="Kitchen Facilities">
          <textarea
            className={inputClass}
            rows={2}
            value={draft.kitchenFacilities}
            onChange={(e) => onChange({ kitchenFacilities: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-6">
        <span className="mb-2 block text-sm font-medium text-navy-dark">Dietaries</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {dietaryOptions.map((option) => {
            const selected = draft.dietaryRequirements.find((d) => d.dietaryRequirementId === option.id);
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
      </div>

      <TimelineEditor items={draft.timelineItems} onChange={onTimelineChange} />
    </Card>
  );
}
