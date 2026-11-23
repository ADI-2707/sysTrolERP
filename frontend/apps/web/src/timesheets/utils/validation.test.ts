import { describe, it, expect } from "vitest";
import { validateQuarterHours, parseClipboardHours } from "./validation";

describe("validateQuarterHours", () => {
  it("accepts valid quarter hour increments", () => {
    expect(validateQuarterHours("0")).toEqual({ valid: true, normalized: "0.00" });
    expect(validateQuarterHours("0.25")).toEqual({ valid: true, normalized: "0.25" });
    expect(validateQuarterHours("0.5")).toEqual({ valid: true, normalized: "0.50" });
    expect(validateQuarterHours("0.75")).toEqual({ valid: true, normalized: "0.75" });
    expect(validateQuarterHours("8")).toEqual({ valid: true, normalized: "8.00" });
    expect(validateQuarterHours(8.25)).toEqual({ valid: true, normalized: "8.25" });
    expect(validateQuarterHours("8.50")).toEqual({ valid: true, normalized: "8.50" });
    expect(validateQuarterHours("24.00")).toEqual({ valid: true, normalized: "24.00" });
    expect(validateQuarterHours("")).toEqual({ valid: true, normalized: "0.00" });
  });

  it("rejects non-quarter hour values", () => {
    const res1 = validateQuarterHours("0.1");
    expect(res1.valid).toBe(false);
    expect(res1.error).toContain("in increments of 0.25");

    const res2 = validateQuarterHours("8.33");
    expect(res2.valid).toBe(false);

    const res3 = validateQuarterHours("1.15");
    expect(res3.valid).toBe(false);
  });

  it("rejects negative numbers and values exceeding max hours", () => {
    const res1 = validateQuarterHours("-1");
    expect(res1.valid).toBe(false);
    expect(res1.error).toContain("cannot be negative");

    const res2 = validateQuarterHours("25");
    expect(res2.valid).toBe(false);
    expect(res2.error).toContain("cannot exceed 24");
  });

  it("rejects invalid non-numeric strings", () => {
    const res = validateQuarterHours("abc");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("valid number");
  });
});

describe("parseClipboardHours", () => {
  it("parses single values", () => {
    expect(parseClipboardHours("8.25")).toEqual([["8.25"]]);
  });

  it("parses tab-delimited values across columns", () => {
    const input = "8.0\t8.0\t8.0\t8.0\t8.0\t0.0\t0.0";
    expect(parseClipboardHours(input)).toEqual([
      ["8.0", "8.0", "8.0", "8.0", "8.0", "0.0", "0.0"],
    ]);
  });

  it("parses multi-row and multi-column clipboard data", () => {
    const input = "8.0\t4.0\n0.0\t4.0";
    expect(parseClipboardHours(input)).toEqual([
      ["8.0", "4.0"],
      ["0.0", "4.0"],
    ]);
  });

  it("returns empty array for whitespace", () => {
    expect(parseClipboardHours("   ")).toEqual([]);
  });
});
