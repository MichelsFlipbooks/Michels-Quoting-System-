"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { formatAustralianTime } from "@/lib/format";
import { QUOTE_STATUS_LABELS, CONFIRMED_EVENT_STATUSES, type QuoteStatus } from "@/lib/constants";
import type { CalendarEvent } from "@/lib/queries";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function isConfirmedStatus(status: QuoteStatus): boolean {
  return (CONFIRMED_EVENT_STATUSES as string[]).includes(status);
}

function statusDotClass(status: QuoteStatus): string {
  if (isConfirmedStatus(status)) return "bg-emerald-400";
  return "bg-amber-400";
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function SidebarCalendarWidget({ events }: { events: CalendarEvent[] }) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [viewMode, setViewMode] = useState<"today" | "week" | "month">("month");
  const [monthCursor, setMonthCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.event_date) ?? [];
      list.push(event);
      map.set(event.event_date, list);
    }
    return map;
  }, [events]);

  const todayKey = toDateKey(today);

  const visibleEvents = useMemo(() => {
    if (viewMode === "today") {
      return events.filter((e) => e.event_date === todayKey);
    }
    if (viewMode === "week") {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return events.filter((e) => {
        const d = new Date(e.event_date + "T00:00:00");
        return d >= start && d <= end;
      });
    }
    if (selectedDate) {
      return events.filter((e) => e.event_date === selectedDate);
    }
    return [];
  }, [viewMode, events, todayKey, today, selectedDate]);

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function changeMonth(delta: number) {
    setMonthCursor(new Date(year, month + delta, 1));
  }

  return (
    <div className="rounded-lg bg-navy-light/40 p-3">
      <div className="mb-2 flex gap-1">
        {(["today", "week", "month"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={clsx(
              "flex-1 rounded px-2 py-1 text-[11px] font-medium capitalize transition-colors",
              viewMode === mode ? "bg-copper text-white" : "text-white/60 hover:bg-white/10",
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      {viewMode === "month" && (
        <>
          <div className="mb-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="rounded px-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              ‹
            </button>
            <span className="text-xs font-semibold text-white">
              {monthCursor.toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="rounded px-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAY_LABELS.map((w, i) => (
              <span key={i} className="text-[9px] font-medium text-white/40">
                {w}
              </span>
            ))}
            {cells.map((day, idx) => {
              if (day === null) return <span key={idx} />;
              const dateKey = toDateKey(new Date(year, month, day));
              const dayEvents = eventsByDate.get(dateKey) ?? [];
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDate;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                  className={clsx(
                    "relative flex h-6 flex-col items-center justify-center rounded text-[10px] transition-colors",
                    isSelected ? "bg-copper text-white" : isToday ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10",
                  )}
                >
                  {day}
                  {dayEvents.length > 0 && (
                    <span className="absolute bottom-0.5 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <span key={i} className={clsx("h-1 w-1 rounded-full", statusDotClass(e.status))} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
        {visibleEvents.length === 0 && (
          <p className="text-[11px] text-white/40">
            {viewMode === "month" && !selectedDate ? "Click a day to see events." : "No events."}
          </p>
        )}
        {visibleEvents.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => router.push(`/quotes/${event.id}`)}
            className="block w-full rounded px-1.5 py-1 text-left hover:bg-white/10"
          >
            <div className="flex items-center gap-1.5">
              <span className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", statusDotClass(event.status))} />
              <span className="truncate text-[11px] font-medium text-white">
                {event.event_name ?? event.client_name}
              </span>
            </div>
            <p className="pl-3 text-[10px] text-white/50">
              {event.start_time ? formatAustralianTime(event.start_time) : ""} {event.venue_name ?? ""} ·{" "}
              {QUOTE_STATUS_LABELS[event.status]}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
