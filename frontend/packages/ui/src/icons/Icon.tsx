import type { ReactNode, SVGAttributes } from "react";

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
