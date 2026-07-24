"use client";

import { Card } from "@/components/ui/Card";

export function NotesSection({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-navy-dark">{title}</h2>
      <p className="mb-4 text-sm text-navy-dark/60">{description}</p>
      <textarea
        className="w-full rounded-md border border-border-soft px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper"
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Card>
  );
}
