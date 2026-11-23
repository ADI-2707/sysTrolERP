import { describe, expect, it } from "vitest";
import { colorTokens } from "./colors";

function getLuminance(hexColor: string): number {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const adjust = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("WCAG AA Token Contrast Audit", () => {
  it("satisfies WCAG AA contrast requirements in light theme", () => {
    const light = colorTokens.light;
    expect(getContrastRatio(light.neutral.textPrimary, light.neutral.bg)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(light.neutral.textPrimary, light.neutral.surface)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(light.neutral.textSecondary, light.neutral.surface)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(light.neutral.textMuted, light.neutral.surface)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(light.accent.ctaText, light.accent.primary)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(light.accent.link, light.neutral.surface)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(light.brand.chipText, light.brand.chipBg)).toBeGreaterThanOrEqual(4.5);
  });

  it("satisfies WCAG AA contrast requirements in dark theme", () => {
    const dark = colorTokens.dark;
    expect(getContrastRatio(dark.neutral.textPrimary, dark.neutral.bg)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(dark.neutral.textPrimary, dark.neutral.surface)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(dark.neutral.textSecondary, dark.neutral.surface)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(dark.neutral.textMuted, dark.neutral.surface)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(dark.accent.ctaText, dark.accent.primary)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(dark.accent.link, dark.neutral.surface)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(dark.brand.chipText, dark.brand.chipBg)).toBeGreaterThanOrEqual(4.5);
  });
});
