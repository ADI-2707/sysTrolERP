import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { NotificationBell } from "./NotificationBell";
import * as notificationsApi from "../../../api/notifications";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders bell icon without red dot when unread count is 0", async () => {
    vi.spyOn(notificationsApi, "fetchUnreadCount").mockResolvedValue({
      unread_count: 0,
      has_unread: false,
    });

    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    const button = screen.getByTestId("notification-bell-button");
    expect(button).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId("notification-red-dot")).not.toBeInTheDocument();
    });
  });

  it("renders red dot when unread count > 0", async () => {
    vi.spyOn(notificationsApi, "fetchUnreadCount").mockResolvedValue({
      unread_count: 3,
      has_unread: true,
    });

    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("notification-red-dot")).toBeInTheDocument();
    });
  });

  it("opens popover, lists notifications, and marks individual item as read", async () => {
    vi.spyOn(notificationsApi, "fetchUnreadCount").mockResolvedValue({
      unread_count: 1,
      has_unread: true,
    });

    vi.spyOn(notificationsApi, "fetchNotifications").mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      page: 1,
      total_pages: 1,
      results: [
        {
          id: 101,
          actor_label: "ADM-001",
          event_type: "TIMESHEET_APPROVED",
          category: "TIMESHEET",
          priority: "NORMAL",
          title: "Timesheet Approved",
          body: "Your timesheet for week 2026-11-23 has been approved.",
          action_url: "/timesheets?week=2026-11-23",
          is_read: false,
          read_at: null,
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ],
    });

    const markReadSpy = vi.spyOn(notificationsApi, "markNotificationRead").mockResolvedValue({
      id: 101,
      actor_label: "ADM-001",
      event_type: "TIMESHEET_APPROVED",
      category: "TIMESHEET",
      priority: "NORMAL",
      title: "Timesheet Approved",
      body: "Your timesheet for week 2026-11-23 has been approved.",
      action_url: "/timesheets?week=2026-11-23",
      is_read: true,
      read_at: new Date().toISOString(),
      metadata: {},
      created_at: new Date().toISOString(),
    });

    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("notification-red-dot")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("notification-bell-button"));

    await waitFor(() => {
      expect(screen.getByTestId("notification-popover")).toBeInTheDocument();
      expect(screen.getByText("Timesheet Approved")).toBeInTheDocument();
      expect(
        screen.getByText("Your timesheet for week 2026-11-23 has been approved.")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("notification-item-101"));

    await waitFor(() => {
      expect(markReadSpy).toHaveBeenCalledWith(101);
      expect(mockNavigate).toHaveBeenCalledWith("/timesheets?week=2026-11-23");
      expect(screen.queryByTestId("notification-popover")).not.toBeInTheDocument();
      expect(screen.queryByTestId("notification-red-dot")).not.toBeInTheDocument();
    });
  });

  it("marks all notifications as read", async () => {
    vi.spyOn(notificationsApi, "fetchUnreadCount").mockResolvedValue({
      unread_count: 2,
      has_unread: true,
    });

    vi.spyOn(notificationsApi, "fetchNotifications").mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      page: 1,
      total_pages: 1,
      results: [
        {
          id: 1,
          actor_label: "EMP-001",
          event_type: "TIMESHEET_SUBMITTED",
          category: "TIMESHEET",
          priority: "NORMAL",
          title: "Timesheet Pending Approval",
          body: "Timesheet for week 2026-11-23 submitted by John Doe has been sent to you to approve.",
          action_url: "/timesheets?week=2026-11-23",
          is_read: false,
          read_at: null,
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ],
    });

    const markAllSpy = vi
      .spyOn(notificationsApi, "markAllNotificationsRead")
      .mockResolvedValue({ marked_read: 2 });

    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("notification-red-dot")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("notification-bell-button"));

    await waitFor(() => {
      expect(screen.getByTestId("mark-all-read-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("mark-all-read-button"));

    await waitFor(() => {
      expect(markAllSpy).toHaveBeenCalled();
      expect(screen.queryByTestId("notification-red-dot")).not.toBeInTheDocument();
    });
  });

  it("closes popover when Escape is pressed", async () => {
    vi.spyOn(notificationsApi, "fetchUnreadCount").mockResolvedValue({
      unread_count: 0,
      has_unread: false,
    });
    vi.spyOn(notificationsApi, "fetchNotifications").mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      page: 1,
      total_pages: 0,
      results: [],
    });

    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("notification-bell-button"));

    await waitFor(() => {
      expect(screen.getByTestId("notification-popover")).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByTestId("notification-popover")).not.toBeInTheDocument();
    });
  });
});
