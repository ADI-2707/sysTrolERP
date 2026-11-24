import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SystemTelemetryCards } from "./SystemTelemetryCards";
import type { HealthCheckData, TelemetrySummaryData } from "../../../api/telemetry";

describe("SystemTelemetryCards", () => {
  const mockHealth: HealthCheckData = {
    status: "healthy",
    database: "connected",
    timestamp: "2026-11-24T03:00:00Z",
  };

  const mockTelemetry: TelemetrySummaryData = {
    "1h": {
      total_requests: 120,
      error_rate: 0.0,
      avg_duration_ms: 35.0,
      p95_duration_ms: 80.0,
      error_count: 0,
    },
    "24h": {
      total_requests: 2500,
      error_rate: 0.004,
      avg_duration_ms: 42.0,
      p95_duration_ms: 110.0,
      error_count: 10,
    },
    "7d": {
      total_requests: 15000,
      error_rate: 0.002,
      avg_duration_ms: 40.0,
      p95_duration_ms: 105.0,
      error_count: 30,
    },
  };

  it("renders live health and request volume cards", () => {
    render(<SystemTelemetryCards health={mockHealth} telemetry={mockTelemetry} />);

    expect(screen.getByTestId("system-telemetry-cards")).toBeInTheDocument();
    expect(screen.getByText("System Health")).toBeInTheDocument();
    expect(screen.getByText("Healthy")).toBeInTheDocument();
    expect(screen.getByText("Database: Connected")).toBeInTheDocument();

    expect(screen.getByText("24h Requests")).toBeInTheDocument();
    expect(screen.getByText("2,500")).toBeInTheDocument();
    expect(screen.getByText(/Avg: 42ms/)).toBeInTheDocument();

    expect(screen.getByText("24h Error Rate")).toBeInTheDocument();
    expect(screen.getByText("0.4%")).toBeInTheDocument();

    expect(screen.getByText("Audit Guarantee")).toBeInTheDocument();
    expect(screen.getByText("Append-Only")).toBeInTheDocument();
  });
});
