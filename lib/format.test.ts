import { describe, expect, it } from "vitest";
import {
  formatAUD,
  formatAustralianDateLong,
  formatAustralianDateShort,
  formatAustralianTime,
  formatMonthLabel,
} from "./format";

describe("formatAUD", () => {
  it("formats cents as Australian dollars", () => {
    expect(formatAUD(151250)).toBe("$1,512.50");
    expect(formatAUD(0)).toBe("$0.00");
    expect(formatAUD(500)).toBe("$5.00");
  });
});

describe("formatAustralianDateLong", () => {
  it("matches the spec's example format", () => {
    expect(formatAustralianDateLong("2026-05-27")).toBe("Wednesday 27th May 2026");
  });

  it("handles 11th/12th/13th special-cased ordinals", () => {
    expect(formatAustralianDateLong("2026-01-11")).toContain("11th");
    expect(formatAustralianDateLong("2026-01-12")).toContain("12th");
    expect(formatAustralianDateLong("2026-01-13")).toContain("13th");
  });

  it("handles 1st/2nd/3rd ordinals", () => {
    expect(formatAustralianDateLong("2026-02-01")).toContain("1st");
    expect(formatAustralianDateLong("2026-02-02")).toContain("2nd");
    expect(formatAustralianDateLong("2026-02-03")).toContain("3rd");
    expect(formatAustralianDateLong("2026-02-04")).toContain("4th");
  });

  it("returns an empty string for a missing date", () => {
    expect(formatAustralianDateLong(null)).toBe("");
  });
});

describe("formatAustralianDateShort", () => {
  it("formats as DD/MM/YYYY", () => {
    expect(formatAustralianDateShort("2026-05-27")).toBe("27/05/2026");
    expect(formatAustralianDateShort("2026-01-05")).toBe("05/01/2026");
  });
});

describe("formatAustralianTime", () => {
  it("converts 24-hour to 12-hour with AM/PM", () => {
    expect(formatAustralianTime("17:30")).toBe("5:30 PM");
    expect(formatAustralianTime("09:05")).toBe("9:05 AM");
    expect(formatAustralianTime("00:00")).toBe("12:00 AM");
    expect(formatAustralianTime("12:00")).toBe("12:00 PM");
    expect(formatAustralianTime("23:59:00")).toBe("11:59 PM");
  });
});

describe("formatMonthLabel", () => {
  it("formats a year-month as a readable label", () => {
    expect(formatMonthLabel("2026-05")).toBe("May 2026");
  });
});
