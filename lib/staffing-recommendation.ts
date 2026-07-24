/**
 * Simple, editable staffing recommendation engine. This is a starting point
 * for staff to adjust, not a final roster — every line it produces stays
 * fully editable in the quote builder.
 */

export const STAFF_MIN_CALL_HOURS = 4;
export const STAFF_SETUP_PACKDOWN_BUFFER_HOURS = 1;
export const EVENT_SUPERVISOR_GUEST_THRESHOLD = 80;

export interface StaffingRecommendationInput {
  serviceLevel: string;
  guestNumbers: number;
  beverageServiceRequired: boolean;
  /** 24-hour "HH:MM" or "HH:MM:SS" */
  startTime: string | null;
  /** 24-hour "HH:MM" or "HH:MM:SS" */
  finishTime: string | null;
}

export interface RecommendedStaffLine {
  roleName: string;
  staffCount: number;
  hours: number;
}

/** Parses "HH:MM" / "HH:MM:SS" into fractional hours since midnight. */
function parseTimeToHours(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + (m ?? 0) / 60;
}

/**
 * Duration in hours between start and finish. Handles events that cross
 * midnight (finish time earlier than start time means the next day).
 */
export function computeEventDurationHours(startTime: string | null, finishTime: string | null): number {
  if (!startTime || !finishTime) return 0;
  const start = parseTimeToHours(startTime);
  const finish = parseTimeToHours(finishTime);
  const duration = finish >= start ? finish - start : finish + 24 - start;
  return Math.round(duration * 4) / 4; // nearest quarter hour
}

/** Staff call length: event duration plus a setup/pack-down buffer, with a minimum call-out. */
export function computeStaffHours(durationHours: number): number {
  return Math.max(durationHours + STAFF_SETUP_PACKDOWN_BUFFER_HOURS, STAFF_MIN_CALL_HOURS);
}

interface ServiceLevelRules {
  guestsPerWaiter: number | null; // null = no waitstaff recommended (e.g. drop-off)
  guestsPerChef: number;
  headChef: boolean;
}

const SERVICE_LEVEL_RULES: Record<string, ServiceLevelRules> = {
  "Drop-off": { guestsPerWaiter: null, guestsPerChef: 0, headChef: false },
  "Self-Service Buffet": { guestsPerWaiter: 25, guestsPerChef: 40, headChef: false },
  "Served Buffet": { guestsPerWaiter: 18, guestsPerChef: 40, headChef: false },
  "Canape / Cocktail": { guestsPerWaiter: 20, guestsPerChef: 35, headChef: false },
  "Plated / Sit-Down": { guestsPerWaiter: 12, guestsPerChef: 30, headChef: true },
  "Full-Service Staffed": { guestsPerWaiter: 10, guestsPerChef: 25, headChef: true },
};

const DEFAULT_RULES: ServiceLevelRules = { guestsPerWaiter: 15, guestsPerChef: 35, headChef: false };

export function recommendStaffing(input: StaffingRecommendationInput): RecommendedStaffLine[] {
  const { serviceLevel, guestNumbers, beverageServiceRequired, startTime, finishTime } = input;

  if (!guestNumbers || guestNumbers <= 0) return [];

  const rules = SERVICE_LEVEL_RULES[serviceLevel] ?? DEFAULT_RULES;
  const durationHours = computeEventDurationHours(startTime, finishTime);
  const hours = computeStaffHours(durationHours);

  const lines: RecommendedStaffLine[] = [];

  // Drop-off has no on-site service staff by definition.
  if (rules.guestsPerWaiter === null && rules.guestsPerChef === 0) {
    return lines;
  }

  if (rules.guestsPerChef > 0) {
    const chefCount = Math.max(1, Math.ceil(guestNumbers / rules.guestsPerChef));
    if (rules.headChef) {
      lines.push({ roleName: "Head Chef", staffCount: 1, hours });
      const supportChefCount = chefCount - 1;
      if (supportChefCount > 0) {
        lines.push({ roleName: "Chef", staffCount: supportChefCount, hours });
      }
    } else {
      lines.push({ roleName: "Chef", staffCount: chefCount, hours });
    }
  }

  if (rules.guestsPerWaiter) {
    const waiterCount = Math.max(1, Math.ceil(guestNumbers / rules.guestsPerWaiter));
    lines.push({ roleName: "Waitstaff", staffCount: waiterCount, hours });
  }

  if (beverageServiceRequired) {
    const bartenderCount = Math.max(1, Math.ceil(guestNumbers / 75));
    lines.push({ roleName: "Bartender", staffCount: bartenderCount, hours });
  }

  if (guestNumbers >= EVENT_SUPERVISOR_GUEST_THRESHOLD) {
    lines.push({ roleName: "Event Supervisor", staffCount: 1, hours });
  }

  return lines;
}
