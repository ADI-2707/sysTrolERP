export type UserRole = "SUPER" | "ADMIN" | "EMPLOYEE";

export interface CurrentUser {
  id: string | number;
  employee_code: string;
  email: string;
  full_name: string;
  phone?: string;
  designation?: string;
  department?: string;
  role: UserRole;
  must_change_password: boolean;
}

export interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  mustChangePassword: boolean;
  login: (identifier: string, password: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<CurrentUser | null>;
}
