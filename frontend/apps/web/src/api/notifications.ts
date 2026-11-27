import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";

export interface NotificationItem {
  id: number;
  actor_label: string;
  event_type: string;
  category: "TIMESHEET" | "PROJECT" | "SYSTEM";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  title: string;
  body: string;
  action_url: string;
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UnreadCountResponse {
  unread_count: number;
  has_unread: boolean;
}

export async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  return apiClient.get<UnreadCountResponse>("/api/notifications/unread-count/");
}

export async function fetchNotifications(params?: {
  is_read?: boolean;
  category?: string;
  page?: number;
}): Promise<PaginatedResponse<NotificationItem>> {
  const searchParams = new URLSearchParams();
  if (params?.is_read !== undefined) {
    searchParams.set("is_read", String(params.is_read));
  }
  if (params?.category) {
    searchParams.set("category", params.category);
  }
  if (params?.page) {
    searchParams.set("page", String(params.page));
  }
  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return apiClient.get<PaginatedResponse<NotificationItem>>(`/api/notifications/${query}`);
}

export async function markNotificationRead(id: number): Promise<NotificationItem> {
  return apiClient.post<NotificationItem>(`/api/notifications/${id}/mark-read/`, {});
}

export async function markAllNotificationsRead(): Promise<{ marked_read: number }> {
  return apiClient.post<{ marked_read: number }>("/api/notifications/mark-all-read/", {});
}
