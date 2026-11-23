import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "../api";
import type { AuthContextValue, CurrentUser } from "./types";

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  const {
    data: user = null,
    isLoading,
    refetch,
  } = useQuery<CurrentUser | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await apiClient.get<CurrentUser>("/api/auth/me/");
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 401) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 60000,
    retry: false,
  });

  useEffect(() => {
    const unsubscribe = apiClient.onUnauthorized(() => {
      queryClient.setQueryData(["auth", "me"], null);
    });
    return unsubscribe;
  }, [queryClient]);

  const login = async (identifier: string, password: string): Promise<CurrentUser> => {
    await apiClient.post("/api/auth/login/", { identifier, password });
    const freshUser = await apiClient.get<CurrentUser>("/api/auth/me/");
    queryClient.setQueryData(["auth", "me"], freshUser);
    return freshUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post("/api/auth/logout/");
    } finally {
      apiClient.clearCsrfToken();
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
    }
  };

  const refreshUser = async (): Promise<CurrentUser | null> => {
    const result = await refetch();
    return result.data ?? null;
  };

  const isAuthenticated = Boolean(user);
  const isSuperAdmin = user?.role === "SUPER";
  const isAdmin = user?.role === "ADMIN";
  const isEmployee = user?.role === "EMPLOYEE";
  const mustChangePassword = Boolean(user?.must_change_password);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isEmployee,
    mustChangePassword,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
