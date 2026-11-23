import json
import os
import sys
from pathlib import Path
from PIL import Image

CANDIDATE_PATHS = [
    Path(r"c:\Users\hp\Desktop\sysTrol\apps\internal\public\favicon.ico"),
    Path(__file__).resolve().parent.parent / "frontend" / "apps" / "web" / "public" / "favicon.ico",
    Path(r"C:\Users\hp\Desktop\sysTrol\apps\web-public\public\favicon.ico"),
]

def find_favicon():
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
        "textDark": "#f8fafc"
    }

def main():
    ico_path = find_favicon()
    if not ico_path:
        print("Error: favicon.ico not found")
        sys.exit(1)

    web_public = Path(__file__).resolve().parent.parent / "frontend" / "apps" / "web" / "public"
    ui_src = Path(__file__).resolve().parent.parent / "frontend" / "packages" / "ui" / "src"
    web_public.mkdir(parents=True, exist_ok=True)
    ui_src.mkdir(parents=True, exist_ok=True)

    with Image.open(ico_path) as orig:
        img = orig.convert("RGBA")
        
        w, h = img.size
        pixels = img.load()
        non_bg_coords = []
        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[x, y]
                if not (r > 245 and g > 245 and b > 245):
                    non_bg_coords.append((x, y))

        if non_bg_coords:
            min_x = min(c[0] for c in non_bg_coords)
            max_x = max(c[0] for c in non_bg_coords)
            min_y = min(c[1] for c in non_bg_coords)
            max_y = max(c[1] for c in non_bg_coords)
            logo_cropped = img.crop((min_x, min_y, max_x + 1, max_y + 1))
        else:
            logo_cropped = img

        palette = sample_colors(img)
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
                "logoMark": "/logo-mark.png",
                "logoFull": "/logo.png"
            }
        }

        with open(web_public / "brand.json", "w", encoding="utf-8") as f:
            json.dump(brand_data, f, indent=2)

        with open(ui_src / "brand.json", "w", encoding="utf-8") as f:
            json.dump(brand_data, f, indent=2)

        logo_cropped.save(web_public / "logo.png", format="PNG")

        mark_coords = [c for c in non_bg_coords if c[0] < 105]
        if mark_coords:
            m_min_x = min(c[0] for c in mark_coords)
            m_max_x = max(c[0] for c in mark_coords)
            m_min_y = min(c[1] for c in mark_coords)
            m_max_y = max(c[1] for c in mark_coords)
            mark_crop = img.crop((m_min_x, m_min_y, m_max_x + 1, m_max_y + 1))
            mw, mh = mark_crop.size
            max_side = max(mw, mh)
            square_mark = Image.new("RGBA", (max_side, max_side), (255, 255, 255, 0))
            offset_x = (max_side - mw) // 2
            offset_y = (max_side - mh) // 2
            square_mark.paste(mark_crop, (offset_x, offset_y))
            square_mark.save(web_public / "logo-mark.png", format="PNG")
        else:
            logo_cropped.save(web_public / "logo-mark.png", format="PNG")

        sizes = {
            "favicon-16x16.png": 16,
            "favicon-32x32.png": 32,
            "favicon-48x48.png": 48,
            "apple-touch-icon.png": 180,
            "logo-192x192.png": 192,
            "logo-512x512.png": 512,
        }

        base_for_icons = Image.open(web_public / "logo-mark.png")
        for filename, size in sizes.items():
            resized = base_for_icons.resize((size, size), Image.Resampling.LANCZOS)
            resized.save(web_public / filename, format="PNG")

        base_for_icons.resize((32, 32), Image.Resampling.LANCZOS).save(web_public / "favicon.ico", format="ICO")

        print("Brand assets successfully generated in", web_public)

if __name__ == "__main__":
    main()
