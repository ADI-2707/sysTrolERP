import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditEmployeeModal } from "./EditEmployeeModal";
import type { EmployeeDetailData } from "../types";

const mockEmployee: EmployeeDetailData = {
  id: 42,
  employee_code: "SYS-0042",
  email: "vikram@example.com",
  full_name: "Vikram Malhotra",
  phone: "9876543210",
  designation: "Senior Engineer",
  department: "Electrical",
  role: "EMPLOYEE",
  is_active: true,
  must_change_password: false,
  revoked_at: null,
  revoked_by: null,
  date_joined: "2026-01-10T09:00:00Z",
  last_login: null,
  assigned_projects: [],
  recent_activity: [],
};

describe("EditEmployeeModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pre-fills form inputs with current employee values", () => {
    render(
      <EditEmployeeModal
        isOpen={true}
        onClose={mockOnClose}
        employee={mockEmployee}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByTestId("edit-employee-form")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Vikram Malhotra")).toBeInTheDocument();
    expect(screen.getByDisplayValue("vikram@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Senior Engineer")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Electrical")).toBeInTheDocument();
    expect(screen.getByDisplayValue("9876543210")).toBeInTheDocument();
  });

  it("submits updated values successfully and closes modal", async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(
      <EditEmployeeModal
        isOpen={true}
        onClose={mockOnClose}
        employee={mockEmployee}
        onSubmit={mockOnSubmit}
      />
    );

    const nameInput = screen.getByTestId("edit-emp-name-input");
    const designationInput = screen.getByTestId("edit-emp-designation-input");

    fireEvent.change(nameInput, { target: { value: "Vikram M." } });
    fireEvent.change(designationInput, { target: { value: "Principal Engineer" } });

    fireEvent.click(screen.getByTestId("edit-emp-submit-btn"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(42, {
        full_name: "Vikram M.",
        email: "vikram@example.com",
        designation: "Principal Engineer",
        department: "Electrical",
        phone: "9876543210",
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("displays error when email or name is empty", async () => {
    render(
      <EditEmployeeModal
        isOpen={true}
        onClose={mockOnClose}
        employee={mockEmployee}
        onSubmit={mockOnSubmit}
      />
    );

    const nameInput = screen.getByTestId("edit-emp-name-input");
    fireEvent.change(nameInput, { target: { value: "" } });

    fireEvent.click(screen.getByTestId("edit-emp-submit-btn"));

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("displays server error message on update failure", async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error("An account with this email already exists."));

    render(
      <EditEmployeeModal
        isOpen={true}
        onClose={mockOnClose}
        employee={mockEmployee}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByTestId("edit-emp-submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("edit-employee-error")).toHaveTextContent("An account with this email already exists.");
    });
  });

  it("closes when cancel button is clicked", () => {
    render(
      <EditEmployeeModal
        isOpen={true}
        onClose={mockOnClose}
        employee={mockEmployee}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByTestId("edit-emp-cancel-btn"));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
