const AUD_FORMATTER = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

export function formatAUD(cents: number): string {
  return AUD_FORMATTER.format(cents / 100);
}

function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/** Parses a plain "YYYY-MM-DD" string as a calendar date, independent of server timezone. */
function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** e.g. "Wednesday 27th May 2026" */
export function formatAustralianDateLong(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = parseDateOnly(dateStr);
  const weekday = date.toLocaleDateString("en-AU", { weekday: "long", timeZone: "UTC" });
  const month = date.toLocaleDateString("en-AU", { month: "long", timeZone: "UTC" });
  const day = date.getUTCDate();
  return `${weekday} ${day}${ordinalSuffix(day)} ${month} ${date.getUTCFullYear()}`;
}

/** e.g. "27/05/2026" */
export function formatAustralianDateShort(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = parseDateOnly(dateStr);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

/** Formats a "HH:MM" or "HH:MM:SS" 24-hour time as 12-hour, e.g. "5:30 PM". */
export function formatAustralianTime(timeStr: string | null): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? "0");
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** "2026-05" -> "May 2026", used to group Confirmed Events by month. */
export function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1));
  return date.toLocaleDateString("en-AU", { month: "long", year: "numeric", timeZone: "UTC" });
}
