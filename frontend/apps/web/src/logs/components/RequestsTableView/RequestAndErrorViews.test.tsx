import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RequestsTableView } from "./RequestsTableView";
import { ErrorsTableView } from "../ErrorsTableView";
import * as logsApi from "../../../api/logs";
import type { RequestLogItem, ErrorLogItem } from "../../types";

vi.mock("../../../api/logs");

const mockRequests: RequestLogItem[] = [
  {
    id: 1,
    method: "POST",
    route_template: "/api/timesheets/",
    path: "/api/timesheets/",
    status_code: 201,
    duration_ms: 45.2,
    actor_label: "alice@systrol.local",
    ip_address: "192.168.1.5",
    response_size_bytes: 1540,
    request_id: "req-post-1",
    created_at: "2026-03-01T14:00:00Z",
  },
  {
    id: 2,
    method: "GET",
    route_template: "/api/projects/",
    path: "/api/projects/?status=active",
    status_code: 500,
    duration_ms: 610.5,
    actor_label: "system",
    ip_address: "127.0.0.1",
    response_size_bytes: 320,
    request_id: "req-get-2",
    created_at: "2026-03-01T14:05:00Z",
  },
];

const mockErrors: ErrorLogItem[] = [
  {
    id: 10,
    error_class: "ValidationError",
    message: "Invalid hours entered for Sunday cell.",
    trace: 'Traceback (most recent call last):\n  File "services.py", line 42, in validate\n    raise ValidationError("Invalid hours")',
    request_id: "req-err-10",
    path: "/api/timesheets/me/",
    method: "POST",
    actor_label: "bob@systrol.local",
    created_at: "2026-03-01T15:00:00Z",
  },
  {
    id: 11,
    error_class: "KeyError",
    message: "'project_id' missing from payload",
    trace: "",
    request_id: "req-err-11",
    path: "/api/projects/",
    method: "POST",
    actor_label: "anon",
    created_at: "2026-03-01T15:10:00Z",
  },
];

describe("RequestsTableView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders request log entries with method, status, duration and size", async () => {
    vi.mocked(logsApi.fetchRequestLogs).mockResolvedValueOnce({
      next: "http://example.com/api/telemetry/requests/?cursor=next-curs",
      previous: null,
      results: mockRequests,
    });

    render(<RequestsTableView />);

    expect(screen.getByTestId("requests-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("req-method-1")).toHaveTextContent("POST");
    });

    expect(screen.getByTestId("req-status-1")).toHaveTextContent("201");
    expect(screen.getByTestId("req-path-1")).toHaveTextContent("/api/timesheets/");
    expect(screen.getByTestId("req-duration-1")).toHaveTextContent("45.2 ms");
    expect(screen.getByTestId("req-size-1")).toHaveTextContent("1.5 KB");
    expect(screen.getByTestId("req-actor-1")).toHaveTextContent("alice@systrol.local");
    expect(screen.getByTestId("req-ip-1")).toHaveTextContent("192.168.1.5");

    expect(screen.getByTestId("req-method-2")).toHaveTextContent("GET");
    expect(screen.getByTestId("req-status-2")).toHaveTextContent("500");
    expect(screen.getByTestId("req-duration-2")).toHaveTextContent("610.5 ms");
  });

  it("handles cursor pagination for request logs", async () => {
    vi.mocked(logsApi.fetchRequestLogs).mockResolvedValueOnce({
      next: "http://example.com/api/telemetry/requests/?cursor=page2",
      previous: null,
      results: [mockRequests[0]],
    });

    render(<RequestsTableView />);

    await waitFor(() => {
      expect(screen.getByTestId("req-method-1")).toBeInTheDocument();
    });

    vi.mocked(logsApi.fetchRequestLogs).mockResolvedValueOnce({
      next: null,
      previous: "http://example.com/api/telemetry/requests/?cursor=page1",
      results: [mockRequests[1]],
    });

    const nextBtn = screen.getByTestId("requests-next-btn");
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(logsApi.fetchRequestLogs).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: "page2" })
      );
      expect(screen.getByTestId("req-method-2")).toBeInTheDocument();
    });
  });
});

describe("ErrorsTableView and ErrorDetailDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders error log entries and opens detail drawer with stack trace", async () => {
    vi.mocked(logsApi.fetchErrorLogs).mockResolvedValueOnce({
      next: null,
      previous: null,
      results: mockErrors,
    });

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<ErrorsTableView />);

    expect(screen.getByTestId("errors-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("error-class-10")).toHaveTextContent("ValidationError");
    });

    expect(screen.getByTestId("error-msg-10")).toHaveTextContent("Invalid hours entered for Sunday cell.");
    expect(screen.getByTestId("error-path-10")).toHaveTextContent("POST /api/timesheets/me/");
    expect(screen.getByTestId("error-actor-10")).toHaveTextContent("bob@systrol.local");

    fireEvent.click(screen.getByTestId("error-class-10"));

    await waitFor(() => {
      expect(screen.getByTestId("error-detail-drawer")).toBeInTheDocument();
    });

    expect(screen.getByTestId("error-drawer-class")).toHaveTextContent("ValidationError");
    expect(screen.getByTestId("error-drawer-message")).toHaveTextContent("Invalid hours entered for Sunday cell.");
    expect(screen.getByTestId("error-drawer-method")).toHaveTextContent("POST");
    expect(screen.getByTestId("error-drawer-path")).toHaveTextContent("/api/timesheets/me/");
    expect(screen.getByTestId("error-drawer-actor")).toHaveTextContent("bob@systrol.local");
    expect(screen.getByTestId("error-drawer-stack-trace")).toHaveTextContent('File "services.py"');

    const copyBtn = screen.getByTestId("error-drawer-copy-trace-btn");
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(mockErrors[0].trace);
      expect(copyBtn).toHaveTextContent("Copied!");
    });
  });

  it("displays empty trace note when stack trace is absent", async () => {
    vi.mocked(logsApi.fetchErrorLogs).mockResolvedValueOnce({
      next: null,
      previous: null,
      results: [mockErrors[1]],
    });

    render(<ErrorsTableView />);

    await waitFor(() => {
      expect(screen.getByTestId("error-class-11")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("error-class-11"));

    await waitFor(() => {
      expect(screen.getByTestId("error-drawer-no-trace")).toBeInTheDocument();
    });
    expect(screen.getByText("No stack trace recorded for this error.")).toBeInTheDocument();
  });
});
