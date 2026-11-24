import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActionReasonModal } from "./ActionReasonModal";

describe("ActionReasonModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders modal details, employee meta, and textarea", () => {
    render(
      <ActionReasonModal
        isOpen={true}
        onClose={mockOnClose}
        title="Revoke Staff Account"
        description="Terminates all active sessions."
        employeeName="Alice Engineer"
        employeeCode="SYS-0001"
        confirmLabel="Revoke Access"
        confirmVariant="danger"
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByTestId("action-reason-form")).toBeInTheDocument();
    expect(screen.getByTestId("action-reason-description")).toHaveTextContent("Terminates all active sessions.");
    expect(screen.getByTestId("action-reason-emp-name")).toHaveTextContent("Alice Engineer");
    expect(screen.getByTestId("action-reason-emp-code")).toHaveTextContent("SYS-0001");
    expect(screen.getByTestId("action-reason-confirm-btn")).toHaveTextContent("Revoke Access");
  });

  it("requires reason before submission", () => {
    render(
      <ActionReasonModal
        isOpen={true}
        onClose={mockOnClose}
        title="Revoke Staff Account"
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.submit(screen.getByTestId("action-reason-form"));

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId("action-reason-error")).toHaveTextContent("A reason is required to perform this action.");
  });

  it("submits valid reason and closes modal", async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(
      <ActionReasonModal
        isOpen={true}
        onClose={mockOnClose}
        title="Restore Staff Account"
        confirmLabel="Restore Access"
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByTestId("action-reason-textarea");
    fireEvent.change(textarea, { target: { value: "Rehired for site operations." } });

    fireEvent.click(screen.getByTestId("action-reason-confirm-btn"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith("Rehired for site operations.");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("displays server error message on failure", async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error("Permission denied."));

    render(
      <ActionReasonModal
        isOpen={true}
        onClose={mockOnClose}
        title="Revoke Staff Account"
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByTestId("action-reason-textarea");
    fireEvent.change(textarea, { target: { value: "Left the company." } });

    fireEvent.click(screen.getByTestId("action-reason-confirm-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("action-reason-error")).toHaveTextContent("Permission denied.");
    });
  });

  it("closes when cancel button is clicked", () => {
    render(
      <ActionReasonModal
        isOpen={true}
        onClose={mockOnClose}
        title="Revoke Staff Account"
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByTestId("action-reason-cancel-btn"));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
