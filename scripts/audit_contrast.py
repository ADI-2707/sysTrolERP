import sys

def luminance(hex_color: str) -> float:
    c = hex_color.lstrip("#")
    r, g, b = [int(c[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
    def adjust(channel: float) -> float:
        return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4
    return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)

def contrast_ratio(hex1: str, hex2: str) -> float:
    l1 = luminance(hex1)
    l2 = luminance(hex2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

PAIRS_TO_AUDIT = [
    ("Light: text primary on app bg", "#0f172a", "#f8fafc", 4.5),
    ("Light: text primary on surface", "#0f172a", "#ffffff", 4.5),
    ("Light: text secondary on surface", "#475569", "#ffffff", 4.5),
    ("Light: text muted on surface", "#64748b", "#ffffff", 4.5),
    ("Light: accent cta text on primary", "#ffffff", "#1e3a8a", 4.5),
    ("Light: accent link on surface", "#1d4ed8", "#ffffff", 4.5),
    ("Light: brand chip text on chip bg", "#14532d", "#dcfce7", 4.5),
    ("Dark: text primary on app bg", "#f0fdf4", "#0b1411", 4.5),
    ("Dark: text primary on surface", "#f0fdf4", "#111d18", 4.5),
    ("Dark: text secondary on surface", "#bbf7d0", "#111d18", 4.5),
    ("Dark: text muted on surface", "#86efac", "#111d18", 4.5),
    ("Dark: accent cta text on primary", "#020617", "#60a5fa", 4.5),
    ("Dark: accent link on surface", "#60a5fa", "#111d18", 4.5),
    ("Dark: brand chip text on chip bg", "#86efac", "#14532d", 4.5),
]

def main() -> None:
    failures = []
    print("Running WCAG AA contrast audit...")
    for label, fg, bg, threshold in PAIRS_TO_AUDIT:
        ratio = contrast_ratio(fg, bg)
        if ratio < threshold:
            failures.append(f"FAIL: {label} ({fg} on {bg}) ratio {ratio:.2f}:1 < {threshold}:1")
        else:
            print(f"PASS: {label} ({fg} on {bg}) ratio {ratio:.2f}:1 >= {threshold}:1")

    if failures:
        print("\nContrast audit failed:")
        for f in failures:
            print(" ", f)
        sys.exit(1)
    print("\nAll color pairs passed WCAG AA compliance.")

if __name__ == "__main__":
    main()
