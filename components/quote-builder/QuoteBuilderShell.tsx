"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClientRecord, updateClientRecord } from "@/actions/clients";
import { saveQuoteDraft } from "@/actions/quotes";
import { issueQuoteVersion } from "@/actions/versions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CatalogueItem, Client, DietaryRequirement } from "@/lib/types";
import type { PackageWithSelections } from "@/lib/queries";
import { CustomerSection } from "./CustomerSection";
import { EventDetailsSection } from "./EventDetailsSection";
import { LineItemSection } from "./LineItemSection";
import { PackagePicker } from "./PackagePicker";
import { StaffingSection } from "./StaffingSection";
import { SummarySection } from "./SummarySection";
import { NotesSection } from "./NotesSection";
import { StatusChangeControl } from "./StatusChangeControl";
import type { QuoteDraft } from "./state";

const TABS = [
  "Customer",
  "Event Details",
  "Food & Menu",
  "Beverages",
  "Staffing",
  "Equipment",
  "Delivery & Travel",
  "Additional Charges",
  "Summary",
  "Internal Notes",
  "Client Notes",
] as const;

export function QuoteBuilderShell({
  initialDraft,
  catalogueItems,
  packages,
  dietaryOptions,
}: {
  initialDraft: QuoteDraft;
  catalogueItems: CatalogueItem[];
  packages: PackageWithSelections[];
  dietaryOptions: DietaryRequirement[];
}) {
  const [draft, setDraft] = useState<QuoteDraft>(initialDraft);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Customer");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isIssuing, startIssuing] = useTransition();
  const router = useRouter();

  function patch(fields: Partial<QuoteDraft>) {
    setDraft((d) => ({ ...d, ...fields }));
    setSaveMessage(null);
  }

  function patchClient(fields: Partial<Client>) {
    setDraft((d) => ({ ...d, client: { ...d.client, ...fields } }));
    setSaveMessage(null);
  }

  function handleMatchedExistingClient(client: Client) {
    setDraft((d) => ({ ...d, client }));
  }

  function handleSave() {
    setSaveError(null);

    if (!draft.client.contact_name.trim()) {
      setSaveError("Please enter the customer's contact name before saving.");
      setActiveTab("Customer");
      return;
    }

    startSaving(async () => {
      let clientId = draft.client.id;

      const clientInput = {
        contact_name: draft.client.contact_name,
        organisation: draft.client.organisation || null,
        email: draft.client.email || null,
        phone: draft.client.phone || null,
        billing_address: draft.client.billing_address || null,
        delivery_address: draft.client.delivery_address || null,
        notes: draft.client.notes || null,
        preferences: draft.client.preferences || null,
      };

      if (!clientId) {
        const result = await createClientRecord(clientInput);
        if (result.error || !result.client) {
          setSaveError(result.error ?? "Could not save the customer.");
          return;
        }
        clientId = result.client.id;
      } else {
        const result = await updateClientRecord(clientId, clientInput);
        if (result.error) {
          setSaveError(result.error);
          return;
        }
      }

      const result = await saveQuoteDraft({
        id: draft.id,
        clientId,
        eventName: draft.eventName || null,
        eventType: draft.eventType || null,
        serviceLevel: draft.serviceLevel || null,
        eventDate: draft.eventDate || null,
        startTime: draft.startTime || null,
        finishTime: draft.finishTime || null,
        venueName: draft.venueName || null,
        venueAddress: draft.venueAddress || null,
        guestNumbers: draft.guestNumbers,
        eventContactName: draft.eventContactName || null,
        eventContactPhone: draft.eventContactPhone || null,
        accessNotes: draft.accessNotes || null,
        parkingLoadingDetails: draft.parkingLoadingDetails || null,
        kitchenFacilities: draft.kitchenFacilities || null,
        clientBudgetCents: draft.clientBudgetCents,
        internalNotes: draft.internalNotes || null,
        clientNotes: draft.clientNotes || null,
        discountType: draft.discountType,
        discountValue: draft.discountValue,
        depositType: draft.depositType,
        depositValue: draft.depositValue,
        quoteDate: draft.quoteDate,
        expiryDate: draft.expiryDate || null,
        nextFollowUpDate: draft.nextFollowUpDate || null,
        lineItems: draft.lineItems.map((li) => ({
          section: li.section,
          line_type: li.line_type,
          catalogue_item_id: li.catalogue_item_id,
          package_id: li.package_id,
          description: li.description,
          internal_description: li.internal_description || null,
          quantity: li.quantity,
          unit: li.unit,
          unit_price_cents: li.unit_price_cents,
          hours: li.hours,
          gst_status: li.gst_status,
          internal_cost_cents: li.internal_cost_cents,
          is_included_selection: li.is_included_selection,
          is_addon: li.is_addon,
          sort_order: li.sort_order,
        })),
        dietaryRequirements: draft.dietaryRequirements.map((d) => ({
          dietary_requirement_id: d.dietaryRequirementId,
          guest_count: d.guestCount,
          notes: d.notes || null,
        })),
        timelineItems: draft.timelineItems.map((t) => ({
          time: t.time || null,
          description: t.description,
          sort_order: t.sort_order,
        })),
      });

      if (result.error || !result.quote) {
        setSaveError(result.error ?? "Could not save the quote.");
        return;
      }

      const wasNew = !draft.id;
      setDraft((d) => ({
        ...d,
        id: result.quote!.id,
        quoteNumber: result.quote!.quote_number,
        status: result.quote!.status,
        client: { ...d.client, id: clientId },
      }));
      setSaveMessage("Saved.");

      if (wasNew) {
        router.replace(`/quotes/${result.quote.id}`);
      } else {
        router.refresh();
      }
    });
  }

  function handleIssueQuote() {
    if (!draft.id) return;
    const reason = draft.currentVersionNumber > 0 ? window.prompt("Reason for this revision (optional):") : null;
    startIssuing(async () => {
      const result = await issueQuoteVersion(draft.id!, reason);
      if (result.error) {
        setSaveError(result.error);
        return;
      }
      router.push(`/quotes/${draft.id}/client-pdf`);
    });
  }

  const setLineItems = (items: typeof draft.lineItems) => patch({ lineItems: items });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy-dark">
            {draft.quoteNumber ?? "New Quote"}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={draft.status} />
            {draft.currentVersionNumber > 0 && (
              <span className="text-xs text-navy-dark/60">Version {draft.currentVersionNumber} issued</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusChangeControl
            quoteId={draft.id}
            status={draft.status}
            onChanged={(status) => patch({ status })}
          />
          {draft.id && (
            <>
              <Link
                href={`/quotes/${draft.id}/kitchen`}
                target="_blank"
                className="rounded-md border border-navy px-3 py-2 text-sm font-medium text-navy hover:bg-navy/5"
              >
                Kitchen Copy
              </Link>
              <button
                type="button"
                onClick={handleIssueQuote}
                disabled={isIssuing}
                className="rounded-md border border-copper px-3 py-2 text-sm font-medium text-copper-dark hover:bg-copper/10 disabled:opacity-40"
              >
                {isIssuing ? "Issuing…" : "Issue Quote / PDF"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {saveError && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>}
      {saveMessage && !saveError && (
        <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{saveMessage}</p>
      )}

      <div className="mb-6 flex flex-wrap gap-1 border-b border-border-soft">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-copper text-copper-dark"
                : "text-navy-dark/60 hover:text-navy-dark"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Customer" && (
        <CustomerSection
          client={draft.client}
          onChange={patchClient}
          onMatchedExistingClient={handleMatchedExistingClient}
        />
      )}

      {activeTab === "Event Details" && (
        <EventDetailsSection
          draft={draft}
          onChange={patch}
          dietaryOptions={dietaryOptions}
          onDietaryChange={(dietaryRequirements) => patch({ dietaryRequirements })}
          onTimelineChange={(timelineItems) => patch({ timelineItems })}
        />
      )}

      {activeTab === "Food & Menu" && (
        <div className="rounded-xl border border-border-soft bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-navy-dark">Food & Menu</h2>
          <PackagePicker
            packages={packages}
            guestNumbers={draft.guestNumbers}
            lineItems={draft.lineItems}
            onChange={setLineItems}
          />
          <LineItemSection
            section="food"
            lineItems={draft.lineItems}
            catalogueItems={catalogueItems}
            onChange={setLineItems}
            title="All Food & Menu Lines"
            helperText="Packages, included selections, add-ons, and custom food lines all appear here — reorder and edit freely."
          />
        </div>
      )}

      {activeTab === "Beverages" && (
        <div className="rounded-xl border border-border-soft bg-white p-6 shadow-sm">
          <LineItemSection
            section="beverage"
            lineItems={draft.lineItems}
            catalogueItems={catalogueItems}
            onChange={setLineItems}
          />
        </div>
      )}

      {activeTab === "Staffing" && (
        <StaffingSection
          lineItems={draft.lineItems}
          catalogueItems={catalogueItems}
          onChange={setLineItems}
          serviceLevel={draft.serviceLevel}
          guestNumbers={draft.guestNumbers}
          startTime={draft.startTime}
          finishTime={draft.finishTime}
        />
      )}

      {activeTab === "Equipment" && (
        <div className="rounded-xl border border-border-soft bg-white p-6 shadow-sm">
          <LineItemSection
            section="equipment"
            lineItems={draft.lineItems}
            catalogueItems={catalogueItems}
            onChange={setLineItems}
          />
        </div>
      )}

      {activeTab === "Delivery & Travel" && (
        <div className="rounded-xl border border-border-soft bg-white p-6 shadow-sm">
          <LineItemSection
            section="delivery_travel"
            lineItems={draft.lineItems}
            catalogueItems={catalogueItems}
            onChange={setLineItems}
          />
        </div>
      )}

      {activeTab === "Additional Charges" && (
        <div className="rounded-xl border border-border-soft bg-white p-6 shadow-sm">
          <LineItemSection
            section="additional_charge"
            lineItems={draft.lineItems}
            catalogueItems={catalogueItems}
            onChange={setLineItems}
          />
        </div>
      )}

      {activeTab === "Summary" && <SummarySection draft={draft} onChange={patch} />}

      {activeTab === "Internal Notes" && (
        <NotesSection
          title="Internal Notes"
          description="Staff-only notes. Never shown to the client."
          value={draft.internalNotes}
          onChange={(internalNotes) => patch({ internalNotes })}
        />
      )}

      {activeTab === "Client Notes" && (
        <NotesSection
          title="Client Notes"
          description="Appears on the client-facing quote for this event."
          value={draft.clientNotes}
          onChange={(clientNotes) => patch({ clientNotes })}
        />
      )}
    </div>
  );
}
