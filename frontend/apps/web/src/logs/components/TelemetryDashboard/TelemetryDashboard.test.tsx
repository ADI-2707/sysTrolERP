import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TelemetryDashboard } from "./TelemetryDashboard";
import * as logsApi from "../../../api/logs";
import type { TelemetrySummaryData } from "../../types";

vi.mock("../../../api/logs", () => ({
  fetchTelemetrySummary: vi.fn(),
}));

const mockSummary: TelemetrySummaryData = {
  "1h": {
    total_requests: 120,
    error_count: 2,
    avg_duration_ms: 32.5,
    p95_duration_ms: 110.0,
  },
  "24h": {
    total_requests: 2840,
    error_count: 14,
    avg_duration_ms: 28.4,
    p95_duration_ms: 95.2,
  },
  "7d": {
    total_requests: 19800,
    error_count: 85,
    avg_duration_ms: 29.1,
    p95_duration_ms: 98.7,
  },
};

describe("TelemetryDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner and displays summary metrics", async () => {
    vi.mocked(logsApi.fetchTelemetrySummary).mockResolvedValueOnce(mockSummary);

    render(<TelemetryDashboard />);

    expect(screen.getByTestId("telemetry-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("telemetry-dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("val-total-requests")).toHaveTextContent("2,840");
      expect(screen.getByTestId("val-avg-latency")).toHaveTextContent("28.4 ms");
      expect(screen.getByTestId("val-p95-latency")).toHaveTextContent("95.2 ms");
    });

    expect(screen.getByTestId("requests-volume-chart")).toBeInTheDocument();
    expect(screen.getByTestId("errors-volume-chart")).toBeInTheDocument();
    expect(screen.getByTestId("latency-trend-chart")).toBeInTheDocument();
  });

  it("switches time window when clicking range buttons", async () => {
    vi.mocked(logsApi.fetchTelemetrySummary).mockResolvedValueOnce(mockSummary);

    render(<TelemetryDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("val-total-requests")).toHaveTextContent("2,840");
    });

    fireEvent.click(screen.getByTestId("range-btn-1h"));
    expect(screen.getByTestId("val-total-requests")).toHaveTextContent("120");
    expect(screen.getByTestId("val-avg-latency")).toHaveTextContent("32.5 ms");

    fireEvent.click(screen.getByTestId("range-btn-7d"));
    expect(screen.getByTestId("val-total-requests")).toHaveTextContent("19,800");
    expect(screen.getByTestId("val-avg-latency")).toHaveTextContent("29.1 ms");
  });

  it("toggles auto-refresh and allows manual refresh", async () => {
    vi.mocked(logsApi.fetchTelemetrySummary).mockResolvedValue(mockSummary);

    render(<TelemetryDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("telemetry-dashboard")).toBeInTheDocument();
    });

    const checkbox = screen.getByTestId("telemetry-auto-refresh-toggle");
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    const refreshBtn = screen.getByTestId("telemetry-refresh-btn");
    fireEvent.click(refreshBtn);

    expect(logsApi.fetchTelemetrySummary).toHaveBeenCalledTimes(2);
  });

  it("displays error message and allows retry", async () => {
    vi.mocked(logsApi.fetchTelemetrySummary).mockRejectedValueOnce(
      new Error("Telemetry service unavailable")
    );

    render(<TelemetryDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("telemetry-error")).toBeInTheDocument();
      expect(screen.getByText("Telemetry service unavailable")).toBeInTheDocument();
    });

    vi.mocked(logsApi.fetchTelemetrySummary).mockResolvedValueOnce(mockSummary);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByTestId("val-total-requests")).toHaveTextContent("2,840");
    });
  });
});
