import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuditTableView } from "./AuditTableView";
import * as logsApi from "../../../api/logs";
import type { AuditLogItem } from "../../types";

vi.mock("../../../api/logs");

const mockAuditLogs: AuditLogItem[] = [
  {
    id: 101,
    actor_kind: "USER",
    actor_label: "Admin John",
    actor_user: { id: 1, code: "SYS-0001", name: "John Doe" },
    action: "EMPLOYEE_UPDATE",
    entity_type: "User",
    entity_id: "42",
    summary: "Updated profile for employee SYS-0042",
    changes: {
      designation: ["Engineer", "Senior Engineer"],
      phone: ["1234567890", "9876543210"],
    },
    ip_address: "192.168.1.10",
    user_agent: "Mozilla/5.0",
    request_id: "req-abc-123",
    super_only: false,
    created_at: "2026-03-01T12:00:00Z",
  },
  {
    id: 102,
    actor_kind: "SUPER",
    actor_label: "superadmin",
    actor_user: null,
    action: "SUPER_CLEAR_LOCKOUT",
    entity_type: "Lockout",
    entity_id: "user@example.com",
    summary: "Cleared login lockout for user@example.com",
    changes: null,
    ip_address: "10.0.0.1",
    user_agent: "Mozilla/5.0",
    request_id: "req-def-456",
    super_only: true,
    created_at: "2026-03-01T12:15:00Z",
  },
];

describe("AuditLogView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders audit table with columns and formatted cells", async () => {
    vi.mocked(logsApi.fetchAuditLogs).mockResolvedValueOnce({
      next: "http://example.com/api/audit/logs/?cursor=next-curs-123",
      previous: null,
      results: mockAuditLogs,
    });

    render(<AuditTableView />);

    expect(screen.getByTestId("audit-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("audit-action-101")).toHaveTextContent("EMPLOYEE_UPDATE");
    });

    expect(screen.getByTestId("audit-actor-101")).toHaveTextContent("Admin John");
    expect(screen.getByTestId("audit-entity-101")).toHaveTextContent("User #42");
    expect(screen.getByTestId("audit-summary-101")).toHaveTextContent("Updated profile for employee SYS-0042");
    expect(screen.getByTestId("audit-ip-101")).toHaveTextContent("192.168.1.10");

    expect(screen.getByTestId("audit-action-102")).toHaveTextContent("SUPER_CLEAR_LOCKOUT");
    expect(screen.getByTestId("audit-next-btn")).not.toBeDisabled();
    expect(screen.getByTestId("audit-prev-btn")).toBeDisabled();
  });

  it("opens detail drawer on row click and displays metadata and diffs", async () => {
    vi.mocked(logsApi.fetchAuditLogs).mockResolvedValueOnce({
      next: null,
      previous: null,
      results: mockAuditLogs,
    });

    render(<AuditTableView />);

    await waitFor(() => {
      expect(screen.getByTestId("audit-action-101")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("audit-action-101"));

    await waitFor(() => {
      expect(screen.getByTestId("audit-detail-drawer")).toBeInTheDocument();
    });

    expect(screen.getByTestId("audit-drawer-action")).toHaveTextContent("EMPLOYEE_UPDATE");
    expect(screen.getByTestId("audit-drawer-summary")).toHaveTextContent("Updated profile for employee SYS-0042");
    expect(screen.getByTestId("audit-drawer-actor-label")).toHaveTextContent("Admin John");
    expect(screen.getByTestId("audit-drawer-actor-user")).toHaveTextContent("SYS-0001 - John Doe");
    expect(screen.getByTestId("audit-drawer-entity")).toHaveTextContent("User #42");
    expect(screen.getByTestId("audit-drawer-request-id")).toHaveTextContent("req-abc-123");

    expect(screen.getByTestId("diff-card-designation")).toBeInTheDocument();
    expect(screen.getByTestId("diff-before-designation")).toHaveTextContent("Engineer");
    expect(screen.getByTestId("diff-after-designation")).toHaveTextContent("Senior Engineer");

    expect(screen.getByTestId("diff-card-phone")).toBeInTheDocument();
    expect(screen.getByTestId("diff-before-phone")).toHaveTextContent("1234567890");
    expect(screen.getByTestId("diff-after-phone")).toHaveTextContent("9876543210");
  });

  it("displays empty diff notice when changes is null", async () => {
    vi.mocked(logsApi.fetchAuditLogs).mockResolvedValueOnce({
      next: null,
      previous: null,
      results: [mockAuditLogs[1]],
    });

    render(<AuditTableView />);

    await waitFor(() => {
      expect(screen.getByTestId("audit-action-102")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("audit-action-102"));

    await waitFor(() => {
      expect(screen.getByTestId("audit-drawer-no-diff")).toBeInTheDocument();
    });
    expect(screen.getByText("No field-level mutations recorded for this event.")).toBeInTheDocument();
  });

  it("handles cursor pagination navigation", async () => {
    vi.mocked(logsApi.fetchAuditLogs).mockResolvedValueOnce({
      next: "http://example.com/api/audit/logs/?cursor=cursor-pg2",
      previous: null,
      results: [mockAuditLogs[0]],
    });

    render(<AuditTableView />);

    await waitFor(() => {
      expect(screen.getByTestId("audit-action-101")).toBeInTheDocument();
    });

    vi.mocked(logsApi.fetchAuditLogs).mockResolvedValueOnce({
      next: null,
      previous: "http://example.com/api/audit/logs/?cursor=cursor-pg1",
      results: [mockAuditLogs[1]],
    });

    const nextBtn = screen.getByTestId("audit-next-btn");
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(logsApi.fetchAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: "cursor-pg2" })
      );
      expect(screen.getByTestId("audit-action-102")).toBeInTheDocument();
    });
  });

  it("displays error alert and supports retry", async () => {
    vi.mocked(logsApi.fetchAuditLogs).mockRejectedValueOnce(new Error("Database connection error"));

    render(<AuditTableView />);

    await waitFor(() => {
      expect(screen.getByTestId("audit-error-alert")).toBeInTheDocument();
    });
    expect(screen.getByText("Database connection error")).toBeInTheDocument();

    vi.mocked(logsApi.fetchAuditLogs).mockResolvedValueOnce({
      next: null,
      previous: null,
      results: mockAuditLogs,
    });

    const retryBtn = screen.getByRole("button", { name: "Retry" });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId("audit-action-101")).toBeInTheDocument();
    });
  });
});
