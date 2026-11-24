import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProfileSection } from "./ProfileSection";
import * as authHook from "../../../auth";

vi.mock("../../../auth", () => ({
  useAuth: vi.fn(),
}));

describe("ProfileSection", () => {
  it("renders employee profile details in read-only mode", () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: {
        id: 42,
        employee_code: "SYS-0042",
        full_name: "Jane Engineer",
        email: "jane@systrol.com",
        phone: "+91 98765 43210",
        designation: "Lead Mechanical Engineer",
        department: "Engineering",
        role: "EMPLOYEE",
        must_change_password: false,
      },
      isLoading: false,
      isAuthenticated: true,
      isSuperAdmin: false,
      isAdmin: false,
      isEmployee: true,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<ProfileSection />);

    expect(screen.getByTestId("user-profile-card")).toBeInTheDocument();
    expect(screen.getByTestId("profile-name")).toHaveTextContent("Jane Engineer");
    expect(screen.getByTestId("profile-code")).toHaveTextContent("SYS-0042");
    expect(screen.getByTestId("profile-email")).toHaveTextContent("jane@systrol.com");
    expect(screen.getByTestId("profile-phone")).toHaveTextContent("+91 98765 43210");
    expect(screen.getByTestId("profile-designation")).toHaveTextContent("Lead Mechanical Engineer");
    expect(screen.getByTestId("profile-department")).toHaveTextContent("Engineering");
    expect(screen.getByTestId("profile-readonly-notice")).toBeInTheDocument();
  });

  it("renders super admin notice when logged in as super admin", () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: {
        id: "super-1",
        employee_code: "root",
        full_name: "Super Administrator",
        email: "admin@system.local",
        role: "SUPER",
        must_change_password: false,
      },
      isLoading: false,
      isAuthenticated: true,
      isSuperAdmin: true,
      isAdmin: false,
      isEmployee: false,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<ProfileSection />);

    expect(screen.getByTestId("super-admin-notice-card")).toBeInTheDocument();
    expect(screen.getByText("Super Administrator Principal")).toBeInTheDocument();
    expect(screen.getByTestId("super-admin-command-snippet")).toHaveTextContent(
      "python manage.py generate_super_admin_hash"
    );
    expect(screen.queryByTestId("user-profile-card")).not.toBeInTheDocument();
  });
});
