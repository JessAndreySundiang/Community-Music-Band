import { describe, expect, it } from "vitest";
import { eventDateParts, localIsoDate, nextUpcomingEvent } from "./events";

/** Deliberately out of order, to prove the helper does not trust the array. */
const events = [
  { id: "c", date: "2027-01-16" },
  { id: "a", date: "2026-11-08" },
  { id: "b", date: "2026-12-13" },
];

describe("eventDateParts", () => {
  it("splits an ISO date without going near a Date object", () => {
    expect(eventDateParts("2026-11-08")).toEqual({ month: "Nov", day: "08", dayOfMonth: 8 });
  });

  it.each(["", "November 8", "2026-11", "2026-13-01", "2026-11-32"])("rejects %o", (date) => {
    expect(eventDateParts(date)).toBeNull();
  });
});

describe("nextUpcomingEvent", () => {
  it("picks the soonest event still to come", () => {
    expect(nextUpcomingEvent(events, new Date(2026, 9, 18))?.id).toBe("a");
  });

  it("moves on once an event has passed", () => {
    expect(nextUpcomingEvent(events, new Date(2026, 11, 1))?.id).toBe("b");
  });

  it("treats a concert day as still upcoming", () => {
    expect(nextUpcomingEvent(events, new Date(2026, 10, 8))?.id).toBe("a");
  });

  it("returns nothing when every announced date is in the past", () => {
    expect(nextUpcomingEvent(events, new Date(2027, 5, 1))).toBeUndefined();
  });

  it("returns nothing for an empty programme", () => {
    expect(nextUpcomingEvent([], new Date(2026, 9, 18))).toBeUndefined();
  });
});

describe("localIsoDate", () => {
  it("formats the day in the visitor's own calendar", () => {
    expect(localIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
