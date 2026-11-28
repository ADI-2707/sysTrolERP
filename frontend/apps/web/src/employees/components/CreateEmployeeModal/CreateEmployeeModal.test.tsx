import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateEmployeeModal } from "./CreateEmployeeModal";
import { TemporaryPasswordModal } from "../TemporaryPasswordModal";

describe("CreateEmployeeModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields correctly and enforces required fields", async () => {
    render(
      <CreateEmployeeModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isSuperAdmin={false}
      />
    );

    expect(screen.getByTestId("create-employee-form")).toBeInTheDocument();
    expect(screen.getByTestId("create-emp-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("create-emp-code-input")).toBeInTheDocument();
    expect(screen.getByTestId("create-emp-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("create-emp-role-select")).toBeDisabled();
    expect(screen.getByTestId("create-emp-role-hint")).toHaveTextContent("Only Super Admin can create Administrators");

    fireEvent.click(screen.getByTestId("create-emp-submit-btn"));

    expect(screen.getByTestId("error-name")).toHaveTextContent("Please enter employee's full name.");
    expect(screen.getByTestId("error-code")).toHaveTextContent("Please enter employee's 4-digit ID.");
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("allows selecting Admin role when isSuperAdmin is true", () => {
    render(
      <CreateEmployeeModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isSuperAdmin={true}
      />
    );

    const roleSelect = screen.getByTestId("create-emp-role-select") as HTMLSelectElement;
    expect(roleSelect).not.toBeDisabled();
    expect(screen.queryByTestId("create-emp-role-hint")).not.toBeInTheDocument();

    fireEvent.change(roleSelect, { target: { value: "ADMIN" } });
    expect(roleSelect.value).toBe("ADMIN");
  });

  it("submits valid employee payload and closes modal on success", async () => {
    mockOnSubmit.mockResolvedValueOnce({
      id: 10,
      employee_code: "SYS-0010",
      email: "newuser@example.com",
      full_name: "New User",
      role: "EMPLOYEE",
      temporary_password: "TempPass123!@#",
      must_change_password: true,
      date_joined: "2026-03-01T10:00:00Z",
    });

    render(
      <CreateEmployeeModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isSuperAdmin={false}
      />
    );

    fireEvent.change(screen.getByTestId("create-emp-name-input"), { target: { value: "New User" } });
    fireEvent.change(screen.getByTestId("create-emp-code-input"), { target: { value: "0010" } });
    fireEvent.change(screen.getByTestId("create-emp-email-input"), { target: { value: "newuser@example.com" } });
    fireEvent.change(screen.getByTestId("create-emp-designation-input"), { target: { value: "Tester" } });
    fireEvent.change(screen.getByTestId("create-emp-department-input"), { target: { value: "QA" } });
    fireEvent.change(screen.getByTestId("create-emp-phone-input"), { target: { value: "9876543210" } });

    fireEvent.click(screen.getByTestId("create-emp-submit-btn"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        full_name: "New User",
        employee_code: "0010",
        email: "newuser@example.com",
        role: "EMPLOYEE",
        designation: "Tester",
        department: "QA",
        phone: "9876543210",
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("submits with custom 4-digit employee code", async () => {
    mockOnSubmit.mockResolvedValueOnce({
      id: 11,
      employee_code: "0042",
      full_name: "Custom Code User",
      role: "EMPLOYEE",
      temporary_password: "TempPass123!@#",
      must_change_password: true,
      date_joined: "2026-03-01T10:00:00Z",
    });

    render(
      <CreateEmployeeModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isSuperAdmin={false}
      />
    );

    fireEvent.change(screen.getByTestId("create-emp-name-input"), { target: { value: "Custom Code User" } });
    fireEvent.change(screen.getByTestId("create-emp-code-input"), { target: { value: "0042" } });
    fireEvent.click(screen.getByTestId("create-emp-submit-btn"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        full_name: "Custom Code User",
        employee_code: "0042",
        email: undefined,
        role: "EMPLOYEE",
        designation: undefined,
        department: undefined,
        phone: undefined,
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("validates 4-digit employee code and blocks reserved 9999", async () => {
    render(
      <CreateEmployeeModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isSuperAdmin={false}
      />
    );

    fireEvent.change(screen.getByTestId("create-emp-name-input"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByTestId("create-emp-code-input"), { target: { value: "123" } });
    fireEvent.click(screen.getByTestId("create-emp-submit-btn"));

    expect(screen.getByTestId("error-code")).toHaveTextContent("Employee ID must be a 4-digit numeric code");
    expect(mockOnSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId("create-emp-code-input"), { target: { value: "9999" } });
    fireEvent.click(screen.getByTestId("create-emp-submit-btn"));

    expect(screen.getByTestId("error-code")).toHaveTextContent("Employee ID 9999 is reserved for Super Administrator.");
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("displays error message on submission failure", async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error("An account with this email already exists."));

    render(
      <CreateEmployeeModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isSuperAdmin={false}
      />
    );

    fireEvent.change(screen.getByTestId("create-emp-name-input"), { target: { value: "Duplicate User" } });
    fireEvent.change(screen.getByTestId("create-emp-code-input"), { target: { value: "0015" } });
    fireEvent.change(screen.getByTestId("create-emp-email-input"), { target: { value: "existing@example.com" } });

    fireEvent.click(screen.getByTestId("create-emp-submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("create-employee-error")).toHaveTextContent("An account with this email already exists.");
    });
  });
});

describe("TemporaryPasswordModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays temporary password, details, warning and allows copying", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <TemporaryPasswordModal
        isOpen={true}
        onClose={mockOnClose}
        temporaryPassword="SecureSecret987!#"
        employeeName="Alice Engineer"
        employeeCode="SYS-0001"
        email="alice@example.com"
        role="ADMIN"
      />
    );

    expect(screen.getByTestId("temporary-password-modal")).toBeInTheDocument();
    expect(screen.getByTestId("temp-password-warning")).toBeInTheDocument();
    expect(screen.getByTestId("temp-pw-name")).toHaveTextContent("Alice Engineer");
    expect(screen.getByTestId("temp-pw-code")).toHaveTextContent("SYS-0001");
    expect(screen.getByTestId("temp-pw-email")).toHaveTextContent("alice@example.com");
    expect(screen.getByTestId("temp-pw-role")).toHaveTextContent("ADMIN");

    const input = screen.getByTestId("temp-password-value") as HTMLInputElement;
    expect(input.value).toBe("SecureSecret987!#");

    const copyBtn = screen.getByTestId("copy-temp-password-btn");
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("SecureSecret987!#");
      expect(copyBtn).toHaveTextContent("Copied!");
    });

    const doneBtn = screen.getByTestId("close-temp-password-btn");
    fireEvent.click(doneBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });
});