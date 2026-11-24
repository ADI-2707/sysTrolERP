import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TimesheetStatusBanner } from "./TimesheetStatusBanner";

describe("TimesheetStatusBanner", () => {
  it("renders OPEN state with active submit button and triggers submit on confirmation", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <TimesheetStatusBanner
        status="OPEN"
        canSubmit={true}
        weekStartDate="2026-11-23"
        onSubmit={handleSubmit}
      />
    );

    expect(screen.getByTestId("timesheet-status-badge")).toHaveTextContent("OPEN");
    expect(screen.getByText("Week In Progress")).toBeInTheDocument();

    const submitBtn = screen.getByTestId("submit-timesheet-btn");
    expect(submitBtn).toBeEnabled();
    fireEvent.click(submitBtn);

    const modal = screen.getByRole("dialog");
    expect(within(modal).getByText("Submit Timesheet")).toBeInTheDocument();
    const confirmBtn = screen.getByRole("button", { name: /^Submit$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  it("renders SUBMITTED state with submission date and without submit button", () => {
    render(
      <TimesheetStatusBanner
        status="SUBMITTED"
        canSubmit={false}
        submittedAt="2026-11-27T18:00:00Z"
      />
    );

    expect(screen.getByTestId("timesheet-status-badge")).toHaveTextContent("SUBMITTED");
    expect(screen.getByText("Timesheet Submitted")).toBeInTheDocument();
    expect(screen.queryByTestId("submit-timesheet-btn")).not.toBeInTheDocument();
  });

  it("renders APPROVED state with approver information", () => {
    render(
      <TimesheetStatusBanner
        status="APPROVED"
        canSubmit={false}
        approvedByLabel="Alice Admin"
        approvedAt="2026-11-28T10:30:00Z"
      />
    );

    expect(screen.getByTestId("timesheet-status-badge")).toHaveTextContent("APPROVED");
    expect(screen.getByText("Timesheet Approved")).toBeInTheDocument();
    expect(screen.getByText(/Approved by Alice Admin/)).toBeInTheDocument();
  });

  it("renders RETURNED state with reason box and re-submit action", () => {
    const handleSubmit = vi.fn();

    render(
      <TimesheetStatusBanner
        status="RETURNED"
        canSubmit={true}
        returnedByLabel="Bob Supervisor"
        returnedAt="2026-11-28T14:00:00Z"
        returnReason="Please correct overtime hours on Wednesday."
        onSubmit={handleSubmit}
      />
    );

    expect(screen.getByTestId("timesheet-status-badge")).toHaveTextContent("RETURNED");
    expect(screen.getByText("Timesheet Returned for Correction")).toBeInTheDocument();
    expect(screen.getByTestId("return-reason-box")).toHaveTextContent(
      "Please correct overtime hours on Wednesday."
    );

    const reSubmitBtn = screen.getByTestId("submit-timesheet-btn");
    expect(reSubmitBtn).toHaveTextContent("Re-submit Timesheet");
  });
});
