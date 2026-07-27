"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StaffMember } from "@/lib/types";

export interface StaffMemberInput {
  full_name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
}

export async function listStaffMembers(includeInactive = false): Promise<StaffMember[]> {
  const supabase = await createClient();
  let query = supabase.from("staff_members").select("*").order("full_name");
  if (!includeInactive) {
    query = query.eq("active", true);
  }
  const { data } = await query;
  return (data as StaffMember[]) ?? [];
}

export async function createStaffMember(
  input: StaffMemberInput,
): Promise<{ staffMember?: StaffMember; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_members")
    .insert(input)
    .select("*")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/staff");
  return { staffMember: data as StaffMember };
}

export async function updateStaffMember(
  id: string,
  input: StaffMemberInput,
): Promise<{ staffMember?: StaffMember; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_members")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/staff");
  return { staffMember: data as StaffMember };
}

export async function setStaffMemberActive(
  id: string,
  active: boolean,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("staff_members").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/staff");
  return {};
}
