import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ReactNode } from "react";
import { apiClient } from "../api";
import { AuthProvider, useAuth } from "./AuthContext";
import type { CurrentUser } from "./types";

describe("AuthContext", () => {
  let queryClient: QueryClient;

  const mockAdminUser: CurrentUser = {
    id: 1,
    employee_code: "SYS-0001",
    email: "admin@systrol.com",
    full_name: "Admin User",
    role: "ADMIN",
    must_change_password: false,
  };

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    queryClient?.clear();
  });

  it("bootstraps with authenticated user from /api/auth/me/", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockAdminUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockAdminUser);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isEmployee).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.mustChangePassword).toBe(false);
  });

  it("handles unauthenticated state gracefully", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValueOnce({
      name: "ApiClientError",
      status: 401,
      code: "authentication_failed",
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("executes login and updates authenticated state", async () => {
    vi.spyOn(apiClient, "get")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockAdminUser);
    vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let loggedInUser: CurrentUser | null = null;
    await act(async () => {
      loggedInUser = await result.current.login("admin", "secretpass");
    });

    expect(loggedInUser).toEqual(mockAdminUser);
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockAdminUser);
    });
  });

  it("executes logout and clears user state", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockAdminUser);
    vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  it("detects super admin and forced password change flags", async () => {
    const mockSuperUser: CurrentUser = {
      id: "super",
      employee_code: "SUPER",
      email: "superadmin@systrol.com",
      full_name: "Super Administrator",
      role: "SUPER",
      must_change_password: true,
    };

    vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockSuperUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.mustChangePassword).toBe(true);
  });
});
