import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ReturnTimesheetModal } from "./ReturnTimesheetModal";

describe("ReturnTimesheetModal", () => {
  it("renders with employee details and disables submit when reason is empty", () => {
    render(
      <ReturnTimesheetModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        employeeName="Alice Smith"
        weekRange="Nov 23 - Nov 29"
      />
    );

    expect(screen.getByText("Return Timesheet for Correction")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Week: Nov 23 - Nov 29")).toBeInTheDocument();

    const submitBtn = screen.getByTestId("confirm-return-button");
    expect(submitBtn).toBeDisabled();
  });

  it("submits non-empty return reason", () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <ReturnTimesheetModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        employeeName="Alice Smith"
        weekRange="Nov 23 - Nov 29"
      />
    );

    const textarea = screen.getByTestId("return-reason-textarea");
    fireEvent.change(textarea, { target: { value: "Please adjust Tuesday overtime." } });

    const submitBtn = screen.getByTestId("confirm-return-button");
    expect(submitBtn).toBeEnabled();
    fireEvent.click(submitBtn);

    expect(handleConfirm).toHaveBeenCalledWith("Please adjust Tuesday overtime.");
  });

  it("calls onClose when Cancel is clicked", () => {
    const handleClose = vi.fn();

    render(
      <ReturnTimesheetModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        employeeName="Alice Smith"
        weekRange="Nov 23 - Nov 29"
      />
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(handleClose).toHaveBeenCalled();
  });
});
