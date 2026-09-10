"use client";

import { useState, useTransition } from "react";
import { findClientByEmail } from "@/actions/clients";
import { Card } from "@/components/ui/Card";
import { EVENT_TYPES, SERVICE_LEVELS } from "@/lib/constants";
import { getDistanceFromKitchen } from "@/lib/maps";
import type { CatalogueItem, Client } from "@/lib/types";
import { LineItemSection } from "./LineItemSection";
import { TimelineEditor } from "./TimelineEditor";
import { VenueAddressAutocomplete, type ParsedVenueAddress } from "./VenueAddressAutocomplete";
import type { DraftTimelineItem, QuoteDraft } from "./state";

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

export function CustomerEventSection({
  draft,
  onChange,
  onChangeClient,
  onMatchedExistingClient,
  catalogueItems,
  onLineItemsChange,
  onTimelineChange,
}: {
  draft: QuoteDraft;
  onChange: (fields: Patch) => void;
  onChangeClient: (fields: Partial<Client>) => void;
  onMatchedExistingClient: (client: Client) => void;
  catalogueItems: CatalogueItem[];
  onLineItemsChange: (items: QuoteDraft["lineItems"]) => void;
  onTimelineChange: (items: DraftTimelineItem[]) => void;
}) {
  const [lookupState, setLookupState] = useState<"idle" | "checking" | "found" | "not-found">("idle");
  const [, startTransition] = useTransition();

  const client = draft.client;
  const isCorporate = draft.eventType === "Corporate";
  const isDelivery = draft.serviceLevel === "Delivery";

  function handleEmailBlur() {
    const email = client.email?.trim();
    if (!email) return;
    setLookupState("checking");
    startTransition(async () => {
      const found = await findClientByEmail(email);
      if (found) {
        onMatchedExistingClient(found);
        setLookupState("found");
      } else {
        setLookupState("not-found");
      }
    });
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
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-navy-dark">Event Date &amp; Time</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Event Date">
            <input
              type="date"
              className={inputClass}
              value={draft.eventDate}
              onChange={(e) => onChange({ eventDate: e.target.value })}
            />
          </Field>
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
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-navy-dark">Customer</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={client.email ?? ""}
              onChange={(e) => {
                onChangeClient({ email: e.target.value });
                setLookupState("idle");
              }}
              onBlur={handleEmailBlur}
              placeholder="jane@example.com.au"
            />
            {lookupState === "checking" && (
              <p className="mt-1 text-xs text-navy-dark/60">Checking for an existing customer…</p>
            )}
            {lookupState === "found" && (
              <p className="mt-1 text-xs font-medium text-emerald-700">
                Existing customer found — details auto-filled below.
              </p>
            )}
            {lookupState === "not-found" && (
              <p className="mt-1 text-xs text-navy-dark/60">
                No existing customer with this email — a new one will be created when you save.
              </p>
            )}
          </Field>

          <Field label="Name">
            <input
              type="text"
              required
              className={inputClass}
              value={client.contact_name}
              onChange={(e) => onChangeClient({ contact_name: e.target.value })}
            />
          </Field>

          <Field label="Phone">
            <input
              type="tel"
              className={inputClass}
              value={client.phone ?? ""}
              onChange={(e) => onChangeClient({ phone: e.target.value })}
            />
          </Field>

          <Field label="Address">
            <textarea
              className={inputClass}
              rows={2}
              value={client.billing_address ?? ""}
              onChange={(e) => onChangeClient({ billing_address: e.target.value })}
            />
          </Field>

          <Field label="Notes">
            <textarea
              className={inputClass}
              rows={2}
              value={client.notes ?? ""}
              onChange={(e) => onChangeClient({ notes: e.target.value })}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-navy-dark">Venue</h2>
        <div className="grid grid-cols-2 gap-4">
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
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-navy-dark">Event Type &amp; Service Level</h2>
        <div className="grid grid-cols-2 gap-4">
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

          <Field label="Guest Numbers">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={draft.guestNumbers ?? ""}
              onChange={(e) => onChange({ guestNumbers: e.target.value ? Number(e.target.value) : null })}
            />
          </Field>

          {isCorporate && (
            <>
              <Field label="Business Name">
                <input
                  type="text"
                  className={inputClass}
                  value={draft.businessName}
                  onChange={(e) => onChange({ businessName: e.target.value })}
                />
              </Field>
              <Field label="Business Address">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={draft.businessAddress}
                  onChange={(e) => onChange({ businessAddress: e.target.value })}
                />
              </Field>
            </>
          )}

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
        </div>

        {isDelivery && (
          <div className="mt-4 space-y-4 rounded-md border border-copper/30 bg-copper/5 p-4">
            <h3 className="text-sm font-semibold text-navy-dark">Delivery Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Delivery Address">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={draft.deliveryAddress}
                  onChange={(e) => onChange({ deliveryAddress: e.target.value })}
                />
              </Field>
              <Field label="Delivery Time">
                <input
                  type="time"
                  className={inputClass}
                  value={draft.deliveryTime}
                  onChange={(e) => onChange({ deliveryTime: e.target.value })}
                />
              </Field>
              <Field label="Delivery Contact">
                <input
                  type="text"
                  className={inputClass}
                  value={draft.deliveryContact}
                  onChange={(e) => onChange({ deliveryContact: e.target.value })}
                />
              </Field>
              <Field label="Time to Leave Kitchen">
                <input
                  type="time"
                  className={inputClass}
                  value={draft.kitchenDepartureTime}
                  onChange={(e) => onChange({ kitchenDepartureTime: e.target.value })}
                />
              </Field>
            </div>

            <LineItemSection
              section="delivery_travel"
              lineItems={draft.lineItems}
              catalogueItems={catalogueItems}
              onChange={onLineItemsChange}
              title="Delivery Charges"
              helperText="Priced delivery/travel lines (e.g. Local Delivery Fee) — these feed the quote total."
            />
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2 rounded-md border border-border-soft bg-cream p-3">
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

        <div className="grid grid-cols-2 gap-4">
          <Field label="Event Contact Name">
            <input
              type="text"
              className={inputClass}
              disabled={draft.eventContactSameAsClient}
              value={draft.eventContactSameAsClient ? client.contact_name : draft.eventContactName}
              onChange={(e) => onChange({ eventContactName: e.target.value })}
            />
          </Field>

          <Field label="Event Contact Phone">
            <input
              type="tel"
              className={inputClass}
              disabled={draft.eventContactSameAsClient}
              value={draft.eventContactSameAsClient ? client.phone ?? "" : draft.eventContactPhone}
              onChange={(e) => onChange({ eventContactPhone: e.target.value })}
            />
          </Field>

          <Field label="Event Contact Email">
            <input
              type="email"
              className={inputClass}
              disabled={draft.eventContactSameAsClient}
              value={draft.eventContactSameAsClient ? client.email ?? "" : draft.eventContactEmail}
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

        <TimelineEditor items={draft.timelineItems} onChange={onTimelineChange} />
      </Card>
    </div>
  );
}
