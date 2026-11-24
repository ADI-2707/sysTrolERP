import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthEventsTableView } from "./AuthEventsTableView";
import * as logsApi from "../../api/logs";
import type { AuditLogItem } from "../types";

vi.mock("../../api/logs", () => ({
  fetchAuditLogs: vi.fn(),
}));

const mockAuthEvents: AuditLogItem[] = [
  {
    id: 101,
    created_at: "2026-03-31T09:00:00Z",
    actor_kind: "USER",
    actor_user: {
      id: 1,
      code: "SYS-0001",
      name: "Admin Alice",
    },
    actor_label: "Admin Alice (SYS-0001)",
    action: "LOGIN_SUCCESS",
    entity_type: "User",
    entity_id: "1",
    summary: "Principal Admin Alice logged in successfully.",
    changes: null,
    ip_address: "192.168.1.50",
    user_agent: "Mozilla/5.0",
    request_id: "req-101",
    super_only: false,
  },
  {
    id: 102,
    created_at: "2026-03-31T09:05:00Z",
    actor_kind: "USER",
    actor_user: null,
    actor_label: "Unknown",
    action: "LOGIN_FAILURE",
    entity_type: "User",
    entity_id: "SYS-9999",
    summary: "Failed login attempt for identifier: SYS-9999",
    changes: null,
    ip_address: "203.0.113.195",
    user_agent: "Mozilla/5.0",
    request_id: "req-102",
    super_only: false,
  },
  {
    id: 103,
    created_at: "2026-03-31T09:10:00Z",
    actor_kind: "SUPER",
    actor_user: null,
    actor_label: "Super Admin (root)",
    action: "SUPER_CLEAR_LOCKOUT",
    entity_type: "User",
    entity_id: "SYS-0002",
    summary: "Cleared login lockout for identifier: SYS-0002",
    changes: null,
    ip_address: "127.0.0.1",
    user_agent: "Mozilla/5.0",
    request_id: "req-103",
    super_only: true,
  },
];

describe("AuthEventsTableView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner and displays auth events list", async () => {
    vi.mocked(logsApi.fetchAuditLogs).mockResolvedValueOnce({
      next: null,
      previous: null,
      results: mockAuthEvents,
    });

    render(<AuthEventsTableView />);

    expect(screen.getByTestId("auth-events-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("auth-badge-101")).toBeInTheDocument();
      expect(screen.getByText("LOGIN_SUCCESS")).toBeInTheDocument();
      expect(screen.getByText("LOGIN_FAILURE")).toBeInTheDocument();
      expect(screen.getByText("SUPER_CLEAR_LOCKOUT")).toBeInTheDocument();
    });

    expect(screen.getByTestId("auth-actor-101")).toHaveTextContent("Admin Alice (SYS-0001)");
    expect(screen.getByTestId("auth-ip-102")).toHaveTextContent("203.0.113.195");
    expect(screen.getByTestId("auth-summary-103")).toHaveTextContent("Cleared login lockout for identifier: SYS-0002");
  });

  it("renders empty state when no events exist", async () => {
    vi.mocked(logsApi.fetchAuditLogs).mockResolvedValueOnce({
      next: null,
      previous: null,
      results: [],
    });

    render(<AuthEventsTableView search="nonexistent" />);

    await waitFor(() => {
      expect(screen.getByText("No authentication events found")).toBeInTheDocument();
    });
  });

  it("opens audit detail drawer when clicking an auth row", async () => {
    vi.mocked(logsApi.fetchAuditLogs).mockResolvedValueOnce({
      next: null,
      previous: null,
      results: mockAuthEvents,
    });

    render(<AuthEventsTableView />);

    await waitFor(() => {
      expect(screen.getByText("LOGIN_SUCCESS")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("LOGIN_SUCCESS"));

    await waitFor(() => {
      expect(screen.getByTestId("audit-detail-drawer")).toBeInTheDocument();
      expect(screen.getByTestId("audit-drawer-summary")).toHaveTextContent(
        "Principal Admin Alice logged in successfully."
      );
    });
  });

  it("handles pagination navigation with cursor tokens", async () => {
    vi.mocked(logsApi.fetchAuditLogs).mockResolvedValueOnce({
      next: "http://localhost:8000/api/audit/logs/?cursor=cD0xMDI%3D",
      previous: null,
      results: [mockAuthEvents[0]],
    });

    render(<AuthEventsTableView />);

    await waitFor(() => {
      expect(screen.getByText("LOGIN_SUCCESS")).toBeInTheDocument();
    });

    const nextBtn = screen.getByTestId("auth-events-next-btn");
    expect(nextBtn).not.toBeDisabled();
    expect(screen.getByTestId("auth-events-prev-btn")).toBeDisabled();

    vi.mocked(logsApi.fetchAuditLogs).mockResolvedValueOnce({
      next: null,
      previous: "http://localhost:8000/api/audit/logs/?cursor=cj0x",
      results: [mockAuthEvents[1]],
    });

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(logsApi.fetchAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: "cD0xMDI=" })
      );
      expect(screen.getByText("LOGIN_FAILURE")).toBeInTheDocument();
    });
  });

  it("displays error message with retry button on failure", async () => {
    vi.mocked(logsApi.fetchAuditLogs).mockRejectedValueOnce(
      new Error("Network connection lost")
    );

    render(<AuthEventsTableView />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-events-error")).toBeInTheDocument();
      expect(screen.getByText("Network connection lost")).toBeInTheDocument();
    });

    vi.mocked(logsApi.fetchAuditLogs).mockResolvedValueOnce({
      next: null,
      previous: null,
      results: mockAuthEvents,
    });

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText("LOGIN_SUCCESS")).toBeInTheDocument();
    });
  });
});
