import { describe, it, expect } from "vitest";
import {
  parseIsoDate,
  formatIsoDate,
  getWeekBounds,
  addWeeks,
  formatWeekDisplay,
  getDayLabel,
} from "./dateUtils";

describe("dateUtils", () => {
  it("parses and formats ISO date consistently", () => {
    const parsed = parseIsoDate("2026-11-24");
    expect(parsed.getUTCFullYear()).toBe(2026);
    expect(parsed.getUTCMonth()).toBe(10);
    expect(parsed.getUTCDate()).toBe(24);
    expect(formatIsoDate(parsed)).toBe("2026-11-24");
  });

  it("calculates Monday and Sunday boundaries regardless of input day of week", () => {
    const mondayBounds = getWeekBounds("2026-11-23");
    expect(mondayBounds.monday).toBe("2026-11-23");
    expect(mondayBounds.sunday).toBe("2026-11-29");
    expect(mondayBounds.days).toHaveLength(7);

    const wednesdayBounds = getWeekBounds("2026-11-25");
    expect(wednesdayBounds.monday).toBe("2026-11-23");
    expect(wednesdayBounds.sunday).toBe("2026-11-29");

    const sundayBounds = getWeekBounds("2026-11-29");
    expect(sundayBounds.monday).toBe("2026-11-23");
    expect(sundayBounds.sunday).toBe("2026-11-29");
  });

  it("shifts weeks forward and backward", () => {
    const nextWeek = addWeeks("2026-11-23", 1);
    expect(nextWeek).toBe("2026-11-30");

    const prevWeek = addWeeks("2026-11-23", -1);
    expect(prevWeek).toBe("2026-11-16");
  });

  it("formats date range displays", () => {
    expect(formatWeekDisplay("2026-11-23", "2026-11-29")).toBe("23 - 29 Nov 2026");
    expect(formatWeekDisplay("2026-11-30", "2026-12-06")).toBe("30 Nov - 6 Dec 2026");
    expect(formatWeekDisplay("2026-12-28", "2027-01-03")).toBe("28 Dec 2026 - 3 Jan 2027");
  });

  it("extracts day label information", () => {
    const label = getDayLabel("2026-11-23");
    expect(label.dayName).toBe("Mon");
    expect(label.dayNumber).toBe(23);
    expect(label.formatted).toBe("Mon 23");
  });
});
