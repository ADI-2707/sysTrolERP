import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Sparkline } from "./Sparkline";
import { LineChart } from "./LineChart";
import { BarChart } from "./BarChart";

describe("Sparkline", () => {
  it("renders empty state when data is empty", () => {
    render(<Sparkline data={[]} />);
    expect(screen.getByTestId("sparkline-empty")).toBeInTheDocument();
  });

  it("renders svg with line and area path when data is provided", () => {
    render(<Sparkline data={[10, 25, 15, 30, 45, 20]} fill />);
    expect(screen.getByTestId("sparkline-svg")).toBeInTheDocument();
    expect(screen.getByTestId("sparkline-line")).toBeInTheDocument();
    expect(screen.getByTestId("sparkline-area")).toBeInTheDocument();
  });

  it("handles single data point gracefully", () => {
    render(<Sparkline data={[50]} width={100} height={40} />);
    expect(screen.getByTestId("sparkline-svg")).toBeInTheDocument();
  });
});

describe("LineChart", () => {
  const samplePoints = [
    { label: "10:00", value: 45 },
    { label: "11:00", value: 80 },
    { label: "12:00", value: 60 },
    { label: "13:00", value: 120 },
  ];

  it("renders empty notice when data is empty", () => {
    render(<LineChart data={[]} />);
    expect(screen.getByTestId("line-chart-empty")).toHaveTextContent("No data available");
  });

  it("renders svg chart with dots, labels, and axes", () => {
    render(<LineChart data={samplePoints} unit="ms" />);
    expect(screen.getByTestId("line-chart-svg")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart-line")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart-area")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart-dot-0")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("13:00")).toBeInTheDocument();
  });

  it("shows tooltip on point hover and hides on leave", () => {
    render(<LineChart data={samplePoints} unit="ms" />);
    const dot = screen.getByTestId("line-chart-dot-1");
    fireEvent.mouseEnter(dot);

    const tooltip = screen.getByTestId("line-chart-tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("11:00: 80ms");

    fireEvent.mouseLeave(dot);
    expect(screen.queryByTestId("line-chart-tooltip")).not.toBeInTheDocument();
  });
});

describe("BarChart", () => {
  const sampleBars = [
    { label: "GET", value: 140 },
    { label: "POST", value: 85 },
    { label: "PUT", value: 30 },
    { label: "DELETE", value: 12 },
  ];

  it("renders empty notice when bars data is empty", () => {
    render(<BarChart data={[]} />);
    expect(screen.getByTestId("bar-chart-empty")).toHaveTextContent("No data available");
  });

  it("renders svg bars with labels and optional values", () => {
    render(<BarChart data={sampleBars} showValues unit="req" />);
    expect(screen.getByTestId("bar-chart-svg")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart-rect-0")).toBeInTheDocument();
    expect(screen.getByTestId("bar-label-0")).toHaveTextContent("GET");
    expect(screen.getByTestId("bar-val-0")).toHaveTextContent("140");
  });

  it("shows tooltip on bar hover and hides on mouseleave", () => {
    render(<BarChart data={sampleBars} unit=" req" />);
    const bar = screen.getByTestId("bar-chart-rect-1");
    fireEvent.mouseEnter(bar);

    const tooltip = screen.getByTestId("bar-chart-tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("POST: 85 req");

    fireEvent.mouseLeave(bar);
    expect(screen.queryByTestId("bar-chart-tooltip")).not.toBeInTheDocument();
  });
});
