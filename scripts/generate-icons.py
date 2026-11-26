import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SVG_ROOT = ROOT / "frontend" / "packages" / "ui" / "svg"
ICONS_OUT = ROOT / "frontend" / "packages" / "ui" / "src" / "icons"

ATTR_MAP = {
    "stroke-width": "strokeWidth",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    "stroke-miterlimit": "strokeMiterlimit",
    "fill-rule": "fillRule",
    "clip-rule": "clipRule",
    "stop-color": "stopColor",
    "stop-opacity": "stopOpacity",
}


def to_pascal_case(name: str) -> str:
    parts = re.split(r"[-_]", name)
    return "".join(p.capitalize() for p in parts if p)


def convert_attrs(svg_str: str) -> str:
    for kebab, camel in ATTR_MAP.items():
        svg_str = svg_str.replace(kebab + "=", camel + "=")
    return svg_str


def main():
    ICONS_OUT.mkdir(parents=True, exist_ok=True)

    icon_wrapper = """import type { ReactNode, SVGAttributes } from "react";

export type IconSize = number | "xs" | "sm" | "md" | "lg" | "xl";

export interface IconProps extends SVGAttributes<SVGElement> {
  size?: IconSize;
  color?: string;
  label?: string;
  className?: string;
  children?: ReactNode;
}

const SIZE_MAP: Record<string, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export function Icon({
  size = 24,
  color = "currentColor",
  label,
  className,
  children,
  ...props
}: IconProps) {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size] ?? 24;
  const isDecorative = !label;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={pixelSize}
      height={pixelSize}
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={isDecorative ? "true" : undefined}
      aria-label={label}
      role={isDecorative ? undefined : "img"}
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}
"""
    with open(ICONS_OUT / "Icon.tsx", "w", encoding="utf-8") as f:
        f.write(icon_wrapper)

    index_exports = ['export * from "./Icon";\n']
    svg_files = sorted(SVG_ROOT.glob("**/*.svg"))

    for svg_file in svg_files:
        raw = svg_file.read_text(encoding="utf-8").strip()
        match = re.search(r"<svg[^>]*>(.*?)</svg>", raw, re.DOTALL)
        if not match:
            continue
        inner_content = match.group(1).strip()
        inner_content = convert_attrs(inner_content)

        base_name = svg_file.stem
        comp_name = f"Icon{to_pascal_case(base_name)}"

        code = f"""import {{ Icon, type IconProps }} from "./Icon";

export function {comp_name}(props: Omit<IconProps, "children">) {{
  return (
    <Icon {{...props}}>
      {inner_content}
    </Icon>
  );
}}
"""
        with open(ICONS_OUT / f"{comp_name}.tsx", "w", encoding="utf-8") as f:
            f.write(code)

        index_exports.append(f'export * from "./{comp_name}";\n')

    with open(ICONS_OUT / "index.ts", "w", encoding="utf-8") as f:
        f.writelines(index_exports)

    print(f"Generated {len(svg_files)} icon components in {ICONS_OUT}")


if __name__ == "__main__":
    main()
