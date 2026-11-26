import json
import sys
from pathlib import Path

from PIL import Image

CANDIDATE_PATHS = [
    Path(__file__).resolve().parent.parent / "frontend" / "apps" / "web" / "public" / "icon.jpeg",
    Path(__file__).resolve().parent.parent / "frontend" / "apps" / "web" / "public" / "favicon.ico",
]


def find_icon():
    for p in CANDIDATE_PATHS:
        if p.exists():
            return p
    return None


def sample_colors(img):
    rgb_img = img.convert("RGB")
    w, h = rgb_img.size
    pixels = rgb_img.load()
    green_candidates = []
    dark_candidates = []
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            if g > r + 20 and g > b + 20:
                green_candidates.append((r, g, b))
            elif r < 60 and g < 60 and b < 75:
                dark_candidates.append((r, g, b))

    brand_green = "#2e7d32"
    if green_candidates:
        avg_r = sum(c[0] for c in green_candidates) // len(green_candidates)
        avg_g = sum(c[1] for c in green_candidates) // len(green_candidates)
        avg_b = sum(c[2] for c in green_candidates) // len(green_candidates)
        brand_green = f"#{avg_r:02x}{avg_g:02x}{avg_b:02x}"

    accent_navy = "#1e3a8a"
    if dark_candidates:
        accent_navy = "#0f172a"

    return {
        "brandGreen": brand_green,
        "brandGreenLight": "#388e3c",
        "brandGreenDark": "#1b5e20",
        "accentNavy": accent_navy,
        "accentNavyLight": "#2563eb",
        "accentNavyDark": "#020617",
        "neutralLight": "#f8fafc",
        "neutralDark": "#0f172a",
        "surfaceLight": "#ffffff",
        "surfaceDark": "#1e293b",
        "borderLight": "#e2e8f0",
        "borderDark": "#334155",
        "textLight": "#0f172a",
        "textDark": "#f8fafc",
    }


def main():
    web_public = Path(__file__).resolve().parent.parent / "frontend" / "apps" / "web" / "public"
    ui_src = Path(__file__).resolve().parent.parent / "frontend" / "apps" / "web" / "src" / "ui"
    web_public.mkdir(parents=True, exist_ok=True)
    ui_src.mkdir(parents=True, exist_ok=True)

    icon_path = find_icon()
    if not icon_path:
        print("Error: icon.jpeg not found")
        sys.exit(1)

    with Image.open(icon_path) as icon_img:
        base_for_icons = icon_img.convert("RGB")
        palette = sample_colors(base_for_icons)
        brand_data = {
            "name": "sysTrol ERP",
            "palette": palette,
            "assets": {
                "favicon16": "/favicon-16x16.png",
                "favicon32": "/favicon-32x32.png",
                "favicon48": "/favicon-48x48.png",
                "appleTouchIcon": "/apple-touch-icon.png",
                "logo192": "/logo-192x192.png",
                "logo512": "/logo-512x512.png",
                "logoMark": "/icon.jpeg",
                "logoFull": "/logo-full.png",
            },
        }

        with open(web_public / "brand.json", "w", encoding="utf-8") as f:
            json.dump(brand_data, f, indent=2)

        with open(ui_src / "brand.json", "w", encoding="utf-8") as f:
            json.dump(brand_data, f, indent=2)

        sizes = {
            "favicon-16x16.png": 16,
            "favicon-32x32.png": 32,
            "favicon-48x48.png": 48,
            "apple-touch-icon.png": 180,
            "logo-192x192.png": 192,
            "logo-512x512.png": 512,
        }

        for filename, size in sizes.items():
            resized = base_for_icons.resize((size, size), Image.Resampling.LANCZOS)
            resized.save(web_public / filename, format="PNG")

        base_for_icons.save(
            web_public / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)]
        )

        print("Brand assets successfully generated in", web_public)


if __name__ == "__main__":
    main()
