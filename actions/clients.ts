"use server";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";

export interface ClientInput {
  contact_name: string;
  organisation: string | null;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  delivery_address: string | null;
  notes: string | null;
  preferences: string | null;
}

/** Looks up a client by exact email match (case-insensitive) for the Customer section's auto-populate flow. */
export async function findClientByEmail(email: string): Promise<Client | null> {
  if (!email.trim()) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .ilike("email", email.trim())
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as Client | null;
}

export async function createClientRecord(input: ClientInput): Promise<{ client?: Client; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...input, created_by: user?.id ?? null })
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { client: data as Client };
}

export async function updateClientRecord(
  id: string,
  input: ClientInput,
): Promise<{ client?: Client; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { client: data as Client };
}

export interface ClientSearchResult extends Client {
  quote_count: number;
}

/** Search clients by name, organisation, or email for the repeat-customer lookup screen. */
export async function searchClients(query: string): Promise<Client[]> {
  const supabase = await createSupabaseServerClient();
  let request = supabase.from("clients").select("*").order("updated_at", { ascending: false }).limit(50);

  if (query.trim()) {
    const q = query.trim();
    request = request.or(
      `contact_name.ilike.%${q}%,organisation.ilike.%${q}%,email.ilike.%${q}%`,
    );
  }

  const { data } = await request;
  return (data as Client[]) ?? [];
}
