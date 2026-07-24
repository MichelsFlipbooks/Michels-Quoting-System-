"use client";

import { newTimelineItem, type DraftTimelineItem } from "./state";

const inputClass =
  "rounded-md border border-border-soft px-2 py-1.5 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper";

export function TimelineEditor({
  items,
  onChange,
}: {
  items: DraftTimelineItem[];
  onChange: (items: DraftTimelineItem[]) => void;
}) {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

  function add() {
    onChange([...items, newTimelineItem(items.length)]);
  }

  function update(localId: string, fields: Partial<DraftTimelineItem>) {
    onChange(items.map((i) => (i.localId === localId ? { ...i, ...fields } : i)));
  }

  function remove(localId: string) {
    onChange(items.filter((i) => i.localId !== localId));
  }

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-navy-dark">
          Run Sheet / Timeline <span className="font-normal text-navy-dark/50">(appears on the kitchen copy)</span>
        </span>
        <button
          type="button"
          onClick={add}
          className="rounded-md border border-copper px-2 py-1 text-xs font-medium text-copper-dark hover:bg-copper/10"
        >
          + Add Timeline Item
        </button>
      </div>
      <div className="space-y-2">
        {sorted.map((item) => (
          <div key={item.localId} className="flex items-center gap-2">
            <input
              type="time"
              className={inputClass}
              value={item.time}
              onChange={(e) => update(item.localId, { time: e.target.value })}
            />
            <input
              type="text"
              placeholder="e.g. Staff arrival & setup"
              className={`${inputClass} flex-1`}
              value={item.description}
              onChange={(e) => update(item.localId, { description: e.target.value })}
            />
            <button
              type="button"
              onClick={() => remove(item.localId)}
              className="rounded px-2 py-1 text-red-700 hover:bg-red-50"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
