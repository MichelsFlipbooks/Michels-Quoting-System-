import { describe, expect, it } from "vitest";
import {
  computeEventDurationHours,
  computeStaffHours,
  recommendStaffing,
  STAFF_MIN_CALL_HOURS,
} from "./staffing-recommendation";

describe("computeEventDurationHours", () => {
  it("computes a same-day duration", () => {
    expect(computeEventDurationHours("18:00", "22:00")).toBe(4);
  });

  it("rounds to the nearest quarter hour", () => {
    expect(computeEventDurationHours("18:00", "21:50")).toBe(3.75);
  });

  it("handles events that cross midnight", () => {
    expect(computeEventDurationHours("22:00", "01:00")).toBe(3);
  });

  it("returns 0 when times are missing", () => {
    expect(computeEventDurationHours(null, "22:00")).toBe(0);
    expect(computeEventDurationHours("18:00", null)).toBe(0);
  });
});

describe("computeStaffHours", () => {
  it("adds the setup/pack-down buffer to event duration", () => {
    expect(computeStaffHours(5)).toBe(6);
  });

  it("never goes below the minimum call-out", () => {
    expect(computeStaffHours(1)).toBe(STAFF_MIN_CALL_HOURS);
  });

  it("adds a travel buffer on top of the setup/pack-down buffer", () => {
    expect(computeStaffHours(5, 1)).toBe(7);
  });

  it("still applies the minimum call-out when duration and travel are both small", () => {
    expect(computeStaffHours(1, 0.5)).toBe(STAFF_MIN_CALL_HOURS);
  });
});

describe("recommendStaffing", () => {
  it("recommends no on-site staff for Delivery service", () => {
    expect(
      recommendStaffing({
        serviceLevel: "Delivery",
        guestNumbers: 100,
        beverageServiceRequired: false,
        startTime: "12:00",
        finishTime: "13:00",
      }),
    ).toEqual([]);
  });

  it("returns no staff when there are no guests", () => {
    expect(
      recommendStaffing({
        serviceLevel: "Full Service — Food Only",
        guestNumbers: 0,
        beverageServiceRequired: false,
        startTime: "18:00",
        finishTime: "22:00",
      }),
    ).toEqual([]);
  });

  it("scales waitstaff and chefs to guest numbers for Full Service — Food Only", () => {
    const lines = recommendStaffing({
      serviceLevel: "Full Service — Food Only",
      guestNumbers: 90,
      beverageServiceRequired: false,
      startTime: "18:00",
      finishTime: "22:00", // 4hr event -> 5hr staff call
    });

    const waitstaff = lines.find((l) => l.roleName === "Waitstaff");
    const chef = lines.find((l) => l.roleName === "Chef");
    expect(waitstaff).toEqual({ roleName: "Waitstaff", staffCount: 5, hours: 5 }); // ceil(90/18)
    expect(chef).toEqual({ roleName: "Chef", staffCount: 3, hours: 5 }); // ceil(90/40)
    expect(lines.find((l) => l.roleName === "Head Chef")).toBeUndefined();
  });

  it("assigns a Head Chef plus support chefs for Serviced Food & Beverage Staff", () => {
    const lines = recommendStaffing({
      serviceLevel: "Serviced Food & Beverage Staff",
      guestNumbers: 120,
      beverageServiceRequired: false,
      startTime: "18:00",
      finishTime: "23:00",
    });

    const headChef = lines.find((l) => l.roleName === "Head Chef");
    const chef = lines.find((l) => l.roleName === "Chef");
    expect(headChef?.staffCount).toBe(1);
    // ceil(120/25) = 5 total chefs, minus the 1 head chef = 4 support chefs
    expect(chef?.staffCount).toBe(4);
  });

  it("adds a bartender when beverage service is required, scaled to guest numbers", () => {
    const lines = recommendStaffing({
      serviceLevel: "Full Service — Food & Beverage",
      guestNumbers: 160,
      beverageServiceRequired: true,
      startTime: "17:00",
      finishTime: "21:00",
    });

    const bartender = lines.find((l) => l.roleName === "Bartender");
    expect(bartender?.staffCount).toBe(3); // ceil(160/75)
  });

  it("omits a bartender entirely when beverage service is not required", () => {
    const lines = recommendStaffing({
      serviceLevel: "Full Service — Food & Beverage",
      guestNumbers: 160,
      beverageServiceRequired: false,
      startTime: "17:00",
      finishTime: "21:00",
    });
    expect(lines.find((l) => l.roleName === "Bartender")).toBeUndefined();
  });

  it("adds an Event Supervisor once guest numbers reach the threshold", () => {
    const small = recommendStaffing({
      serviceLevel: "Full Service — Food Only",
      guestNumbers: 79,
      beverageServiceRequired: false,
      startTime: "18:00",
      finishTime: "22:00",
    });
    const large = recommendStaffing({
      serviceLevel: "Full Service — Food Only",
      guestNumbers: 80,
      beverageServiceRequired: false,
      startTime: "18:00",
      finishTime: "22:00",
    });
    expect(small.find((l) => l.roleName === "Event Supervisor")).toBeUndefined();
    expect(large.find((l) => l.roleName === "Event Supervisor")).toBeDefined();
  });

  it("always recommends at least one chef and one waiter even for very small guest counts", () => {
    const lines = recommendStaffing({
      serviceLevel: "Full Service — Food Only",
      guestNumbers: 5,
      beverageServiceRequired: false,
      startTime: "18:00",
      finishTime: "20:00",
    });
    expect(lines.find((l) => l.roleName === "Chef")?.staffCount).toBe(1);
    expect(lines.find((l) => l.roleName === "Waitstaff")?.staffCount).toBe(1);
  });

  it("extends every staff line's hours to cover round-trip travel time", () => {
    const lines = recommendStaffing({
      serviceLevel: "Full Service — Food Only",
      guestNumbers: 90,
      beverageServiceRequired: false,
      startTime: "18:00",
      finishTime: "22:00", // 4hr event + 1hr setup/packdown = 5hr base call
      travelMinutesEachWay: 45, // 1.5hr round trip
    });

    const waitstaff = lines.find((l) => l.roleName === "Waitstaff");
    expect(waitstaff?.hours).toBe(6.5);
  });
});
