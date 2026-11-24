import { useState, useMemo } from "react";
import styles from "./Charts.module.css";

export interface LineChartPoint {
  label: string;
  value: number;
}

export interface LineChartProps {
  data: LineChartPoint[];
  height?: number;
  color?: string;
  strokeWidth?: number;
  showDots?: boolean;
  showGrid?: boolean;
  fillArea?: boolean;
  yAxisFormatter?: (val: number) => string;
  unit?: string;
  className?: string;
  ariaLabel?: string;
}

export function LineChart({
  data,
  height = 200,
  color = "var(--color-brand-30-primary, #16a34a)",
  strokeWidth = 2,
  showDots = true,
  showGrid = true,
  fillArea = true,
  yAxisFormatter = (v) => v.toFixed(0),
  unit = "",
  className,
  ariaLabel = "Line chart",
}: LineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    label: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;
  const viewBoxWidth = 600;

  const chartWidth = viewBoxWidth - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const { points, yTicks, pathD, areaD } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], yTicks: [], pathD: "", areaD: "" };
    }

    const values = data.map((d) => d.value);
    const minVal = 0;
    const maxVal = Math.max(1, ...values) * 1.1;

    const ticksCount = 4;
    const ticks: number[] = [];
    for (let i = 0; i <= ticksCount; i++) {
      ticks.push(minVal + ((maxVal - minVal) / ticksCount) * i);
    }

    const pts = data.map((d, i) => {
      const x =
        data.length === 1
          ? paddingLeft + chartWidth / 2
          : paddingLeft + (i / (data.length - 1)) * chartWidth;
      const y =
        paddingTop + chartHeight - ((d.value - minVal) / (maxVal - minVal)) * chartHeight;
      return { ...d, x, y };
    });

    const pD = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");

    const aD =
      pts.length > 0
        ? `${pD} L ${pts[pts.length - 1].x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} Z`
        : "";

    return { points: pts, yTicks: ticks, pathD: pD, areaD: aD };
  }, [data, chartWidth, chartHeight]);

  if (!data || data.length === 0) {
    return (
      <div className={[styles.chartContainer, className].filter(Boolean).join(" ")}>
        <div className={styles.emptyNotice} data-testid="line-chart-empty">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div
      className={[styles.chartContainer, className].filter(Boolean).join(" ")}
      data-testid="line-chart-container"
    >
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${height}`}
        className={styles.chartSvg}
        aria-label={ariaLabel}
        data-testid="line-chart-svg"
      >
        {showGrid &&
          yTicks.map((tick, i) => {
            const y =
              paddingTop + chartHeight - (i / (yTicks.length - 1)) * chartHeight;
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartWidth}
                  y2={y}
                  className={styles.gridLine}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className={styles.axisText}
                >
                  {yAxisFormatter(tick)}
                </text>
              </g>
            );
          })}

        {points.map((p, i) => {
          const step = Math.max(1, Math.floor(points.length / 6));
          const shouldShowLabel =
            i === 0 || i === points.length - 1 || i % step === 0;
          if (!shouldShowLabel) return null;
          return (
            <text
              key={`x-label-${i}`}
              x={p.x}
              y={height - 6}
              textAnchor="middle"
              className={styles.axisText}
            >
              {p.label}
            </text>
          );
        })}

        {fillArea && areaD && (
          <path
            d={areaD}
            fill={color}
            className={styles.areaPath}
            data-testid="line-chart-area"
          />
        )}

        <path
          d={pathD}
          stroke={color}
          strokeWidth={strokeWidth}
          className={styles.linePath}
          data-testid="line-chart-line"
        />

        {showDots &&
          points.map((p, i) => (
            <circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r={3}
              stroke={color}
              className={styles.dataDot}
              data-testid={`line-chart-dot-${i}`}
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
      </svg>

      {hoveredPoint && (
        <div
          className={styles.tooltipBox}
          style={{
            left: `${(hoveredPoint.x / viewBoxWidth) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
          }}
          data-testid="line-chart-tooltip"
        >
          {hoveredPoint.label}: {hoveredPoint.value}
          {unit}
        </div>
      )}
    </div>
  );
}
