"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { searchClients } from "@/actions/clients";
import { Card } from "@/components/ui/Card";
import type { Client } from "@/lib/types";

export default function ClientsPage() {
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(async () => {
        const results = await searchClients(query);
        setClients(results);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-dark">Clients</h1>
      </div>

      <Card className="mb-6">
        <label htmlFor="client-search" className="mb-1 block text-sm font-medium text-navy-dark">
          Search by name, organisation, or email
        </label>
        <input
          id="client-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. jane@acme.com.au or Acme Pty Ltd"
          className="w-full max-w-md rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper"
        />
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border-soft bg-cream text-left text-xs font-semibold uppercase tracking-wide text-navy-dark/70">
            <tr>
              <th className="px-4 py-3">Contact Name</th>
              <th className="px-4 py-3">Organisation</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="px-4 py-3 font-medium text-navy-dark">{client.contact_name}</td>
                <td className="px-4 py-3">{client.organisation ?? "—"}</td>
                <td className="px-4 py-3">{client.email ?? "—"}</td>
                <td className="px-4 py-3">{client.phone ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/quotes/new?clientId=${client.id}`}
                    className="font-medium text-copper hover:underline"
                  >
                    New quote →
                  </Link>
                </td>
              </tr>
            ))}
            {!isPending && clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-navy-dark/50">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
