"use client";

import { useState, useTransition } from "react";
import { findClientByEmail } from "@/actions/clients";
import { Card } from "@/components/ui/Card";
import type { Client } from "@/lib/types";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-navy-dark">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper";

export function CustomerSection({
  client,
  onChange,
  onMatchedExistingClient,
}: {
  client: Client;
  onChange: (fields: Partial<Client>) => void;
  onMatchedExistingClient: (client: Client) => void;
}) {
  const [lookupState, setLookupState] = useState<"idle" | "checking" | "found" | "not-found">("idle");
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-navy-dark">Customer</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={client.email ?? ""}
              onChange={(e) => {
                onChange({ email: e.target.value });
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

          <Field label="Contact Name">
            <input
              type="text"
              required
              className={inputClass}
              value={client.contact_name}
              onChange={(e) => onChange({ contact_name: e.target.value })}
            />
          </Field>

          <Field label="Organisation">
            <input
              type="text"
              className={inputClass}
              value={client.organisation ?? ""}
              onChange={(e) => onChange({ organisation: e.target.value })}
            />
          </Field>

          <Field label="Phone">
            <input
              type="tel"
              className={inputClass}
              value={client.phone ?? ""}
              onChange={(e) => onChange({ phone: e.target.value })}
            />
          </Field>

          <Field label="Billing Address">
            <textarea
              className={inputClass}
              rows={2}
              value={client.billing_address ?? ""}
              onChange={(e) => onChange({ billing_address: e.target.value })}
            />
          </Field>

          <Field label="Delivery Address">
            <textarea
              className={inputClass}
              rows={2}
              value={client.delivery_address ?? ""}
              onChange={(e) => onChange({ delivery_address: e.target.value })}
            />
          </Field>

          <Field label="Client Notes (persists across future quotes)">
            <textarea
              className={inputClass}
              rows={2}
              value={client.notes ?? ""}
              onChange={(e) => onChange({ notes: e.target.value })}
            />
          </Field>

          <Field label="Preferences">
            <textarea
              className={inputClass}
              rows={2}
              value={client.preferences ?? ""}
              onChange={(e) => onChange({ preferences: e.target.value })}
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}
