import { useState, useMemo } from "react";
import styles from "./Charts.module.css";

export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarChartItem[];
  height?: number;
  barColor?: string;
  showGrid?: boolean;
  showValues?: boolean;
  yAxisFormatter?: (val: number) => string;
  unit?: string;
  className?: string;
  ariaLabel?: string;
}

export function BarChart({
  data,
  height = 200,
  barColor = "var(--color-brand-30-primary, #16a34a)",
  showGrid = true,
  showValues = false,
  yAxisFormatter = (v) => v.toFixed(0),
  unit = "",
  className,
  ariaLabel = "Bar chart",
}: BarChartProps) {
  const [hoveredBar, setHoveredBar] = useState<{
    label: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;
  const viewBoxWidth = 600;

  const chartWidth = viewBoxWidth - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const { bars, yTicks } = useMemo(() => {
    if (!data || data.length === 0) {
      return { bars: [], yTicks: [] };
    }

    const values = data.map((d) => d.value);
    const minVal = 0;
    const maxVal = Math.max(1, ...values) * 1.15;

    const ticksCount = 4;
    const ticks: number[] = [];
    for (let i = 0; i <= ticksCount; i++) {
      ticks.push(minVal + ((maxVal - minVal) / ticksCount) * i);
    }

    const barSlotWidth = chartWidth / data.length;
    const barWidth = Math.min(48, Math.max(8, barSlotWidth * 0.6));

    const computedBars = data.map((d, i) => {
      const slotCenterX = paddingLeft + i * barSlotWidth + barSlotWidth / 2;
      const x = slotCenterX - barWidth / 2;
      const barH = ((d.value - minVal) / (maxVal - minVal)) * chartHeight;
      const y = paddingTop + chartHeight - barH;
      return {
        ...d,
        x,
        y,
        width: barWidth,
        height: barH,
        centerX: slotCenterX,
      };
    });

    return { bars: computedBars, yTicks: ticks };
  }, [data, chartWidth, chartHeight]);

  if (!data || data.length === 0) {
    return (
      <div className={[styles.chartContainer, className].filter(Boolean).join(" ")}>
        <div className={styles.emptyNotice} data-testid="bar-chart-empty">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div
      className={[styles.chartContainer, className].filter(Boolean).join(" ")}
      data-testid="bar-chart-container"
    >
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${height}`}
        className={styles.chartSvg}
        aria-label={ariaLabel}
        data-testid="bar-chart-svg"
      >
        {showGrid &&
          yTicks.map((tick, i) => {
            const y =
              paddingTop + chartHeight - (i / (yTicks.length - 1)) * chartHeight;
            return (
              <g key={`bar-grid-${i}`}>
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

        {bars.map((bar, i) => (
          <g key={`bar-group-${i}`}>
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={Math.max(2, bar.height)}
              rx={3}
              fill={bar.color || barColor}
              className={styles.barRect}
              data-testid={`bar-chart-rect-${i}`}
              onMouseEnter={() =>
                setHoveredBar({
                  label: bar.label,
                  value: bar.value,
                  x: bar.centerX,
                  y: bar.y,
                })
              }
              onMouseLeave={() => setHoveredBar(null)}
            />

            {showValues && (
              <text
                x={bar.centerX}
                y={bar.y - 4}
                textAnchor="middle"
                className={styles.axisText}
                data-testid={`bar-val-${i}`}
              >
                {bar.value}
              </text>
            )}

            <text
              x={bar.centerX}
              y={height - 6}
              textAnchor="middle"
              className={styles.axisText}
              data-testid={`bar-label-${i}`}
            >
              {bar.label}
            </text>
          </g>
        ))}
      </svg>

      {hoveredBar && (
        <div
          className={styles.tooltipBox}
          style={{
            left: `${(hoveredBar.x / viewBoxWidth) * 100}%`,
            top: `${(hoveredBar.y / height) * 100}%`,
          }}
          data-testid="bar-chart-tooltip"
        >
          {hoveredBar.label}: {hoveredBar.value}
          {unit}
        </div>
      )}
    </div>
  );
}
