import { useMemo } from "react";
import styles from "./Charts.module.css";

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = "var(--color-brand-30-primary, #16a34a)",
  strokeWidth = 2,
  fill = false,
  className,
  ariaLabel = "Sparkline chart",
}: SparklineProps) {
  const { pathD, fillD } = useMemo(() => {
    if (!data || data.length === 0) {
      return { pathD: "", fillD: "" };
    }
    if (data.length === 1) {
      const y = height / 2;
      return {
        pathD: `M 0 ${y} L ${width} ${y}`,
        fillD: `M 0 ${y} L ${width} ${y} L ${width} ${height} L 0 ${height} Z`,
      };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min === 0 ? 1 : max - min;
    const padding = 2;
    const effH = height - padding * 2;
    const effW = width;

    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * effW;
      const y = height - padding - ((val - min) / range) * effH;
      return { x, y };
    });

    const d = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");

    const fD = `${d} L ${width} ${height} L 0 ${height} Z`;

    return { pathD: d, fillD: fD };
  }, [data, width, height]);

  if (!data || data.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        className={className}
        aria-label={ariaLabel}
        data-testid="sparkline-empty"
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={[styles.chartSvg, className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
      data-testid="sparkline-svg"
    >
      {fill && (
        <path
          d={fillD}
          fill={color}
          className={styles.areaPath}
          data-testid="sparkline-area"
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        className={styles.linePath}
        data-testid="sparkline-line"
      />
    </svg>
  );
}
