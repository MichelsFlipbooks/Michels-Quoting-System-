"use client";

import { useState, useTransition } from "react";
import { createStaffMember, setStaffMemberActive, updateStaffMember, type StaffMemberInput } from "@/actions/staff";
import { Card } from "@/components/ui/Card";
import type { StaffMember } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper";

const emptyForm: StaffMemberInput = { full_name: "", role_title: "", email: "", phone: "" };

export function StaffProfilesManager({ initialStaff }: { initialStaff: StaffMember[] }) {
  const [staff, setStaff] = useState(initialStaff);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<StaffMemberInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(member: StaffMember) {
    setEditingId(member.id);
    setShowAddForm(false);
    setForm({
      full_name: member.full_name,
      role_title: member.role_title,
      email: member.email,
      phone: member.phone,
    });
  }

  function startAdd() {
    setShowAddForm(true);
    setEditingId(null);
    setForm(emptyForm);
  }

  function cancel() {
    setShowAddForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function submit() {
    if (!form.full_name.trim()) {
      setError("Full name is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      if (editingId) {
        const result = await updateStaffMember(editingId, form);
        if (result.error || !result.staffMember) {
          setError(result.error ?? "Could not update staff member.");
          return;
        }
        setStaff((s) => s.map((m) => (m.id === editingId ? result.staffMember! : m)));
      } else {
        const result = await createStaffMember(form);
        if (result.error || !result.staffMember) {
          setError(result.error ?? "Could not create staff member.");
          return;
        }
        setStaff((s) => [...s, result.staffMember!].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      }
      cancel();
    });
  }

  function toggleActive(member: StaffMember) {
    startTransition(async () => {
      await setStaffMemberActive(member.id, !member.active);
      setStaff((s) => s.map((m) => (m.id === member.id ? { ...m, active: !m.active } : m)));
    });
  }

  const isFormOpen = showAddForm || editingId !== null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-dark">Staff Profiles</h1>
        <button
          type="button"
          onClick={startAdd}
          className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
        >
          + Add Staff
        </button>
      </div>
      <p className="mb-6 text-sm text-navy-dark/60">Manage staff who appear in the "Assigned To" dropdown on quotes.</p>

      {isFormOpen && (
        <Card className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy-dark">Full Name</span>
              <input
                type="text"
                className={inputClass}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy-dark">Role / Title</span>
              <input
                type="text"
                className={inputClass}
                value={form.role_title ?? ""}
                onChange={(e) => setForm({ ...form, role_title: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy-dark">Email</span>
              <input
                type="email"
                className={inputClass}
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy-dark">Phone</span>
              <input
                type="tel"
                className={inputClass}
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
          </div>
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={cancel} className="rounded-md px-3 py-2 text-sm text-navy-dark/70 hover:bg-cream">
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {editingId ? "Save Changes" : "Add Staff"}
            </button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {staff.map((member) => (
          <Card key={member.id} className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-navy-dark">{member.full_name}</p>
              <p className="text-sm text-navy-dark/60">{member.role_title ?? "—"}</p>
              <p className="text-xs text-navy-dark/50">
                {member.email ?? "—"} {member.phone ? `· ${member.phone}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  member.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                {member.active ? "Active" : "Inactive"}
              </span>
              <button
                type="button"
                onClick={() => startEdit(member)}
                className="text-sm font-medium text-copper hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => toggleActive(member)}
                className="text-sm font-medium text-navy-dark/60 hover:underline"
              >
                {member.active ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          </Card>
        ))}
        {staff.length === 0 && !isFormOpen && (
          <Card>
            <p className="text-center text-navy-dark/50">No staff profiles yet. Add your first one above.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
