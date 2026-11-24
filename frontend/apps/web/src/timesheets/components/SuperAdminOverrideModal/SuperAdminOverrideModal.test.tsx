import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SuperAdminOverrideModal } from "./SuperAdminOverrideModal";

describe("SuperAdminOverrideModal", () => {
  it("renders with security notice and disables submit when reason is empty", () => {
    render(
      <SuperAdminOverrideModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        employeeName="John Engineer"
        weekRange="Nov 23 - Nov 29"
        currentStatus="OPEN"
      />
    );

    expect(screen.getByText("Super Admin Override")).toBeInTheDocument();
    expect(screen.getByText(/Security Notice:/)).toBeInTheDocument();
    expect(screen.getByText(/John Engineer/)).toBeInTheDocument();

    const submitBtn = screen.getByTestId("confirm-override-button");
    expect(submitBtn).toBeDisabled();
  });

  it("submits target status and audit reason", () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <SuperAdminOverrideModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        employeeName="John Engineer"
        weekRange="Nov 23 - Nov 29"
        currentStatus="OPEN"
      />
    );

    const select = screen.getByTestId("override-status-select");
    fireEvent.change(select, { target: { value: "APPROVED" } });

    const textarea = screen.getByTestId("override-reason-textarea");
    fireEvent.change(textarea, { target: { value: "Executive emergency approval." } });

    const submitBtn = screen.getByTestId("confirm-override-button");
    expect(submitBtn).toBeEnabled();
    fireEvent.click(submitBtn);

    expect(handleConfirm).toHaveBeenCalledWith({
      status: "APPROVED",
      reason: "Executive emergency approval.",
    });
  });

  it("calls onClose when Cancel is clicked", () => {
    const handleClose = vi.fn();

    render(
      <SuperAdminOverrideModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        employeeName="John Engineer"
        weekRange="Nov 23 - Nov 29"
        currentStatus="OPEN"
      />
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(handleClose).toHaveBeenCalled();
  });
});
