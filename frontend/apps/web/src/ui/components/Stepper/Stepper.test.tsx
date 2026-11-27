import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Stepper, type StepperItem } from "./Stepper";

describe("Stepper component", () => {
  const steps: StepperItem[] = [
    {
      id: "s1",
      title: "Enquiry",
      status: "COMPLETED",
      position: 1,
    },
    {
      id: "s2",
      title: "Sales Visit",
      status: "IN_PROGRESS",
      position: 2,
    },
    {
      id: "s-sub",
      title: "Custom Review",
      status: "NOT_STARTED",
      isCustom: true,
      position: 3,
    },
    {
      id: "s3",
      title: "Procurement",
      status: "NOT_STARTED",
      position: 4,
    },
  ];

  it("renders steps with status badges and indicators", () => {
    render(<Stepper items={steps} />);

    expect(screen.getByText("Enquiry")).toBeInTheDocument();
    expect(screen.getByText("Sales Visit")).toBeInTheDocument();
    expect(screen.getByText("Custom Sub-step")).toBeInTheDocument();
    expect(screen.getByText("COMPLETED")).toBeInTheDocument();
    expect(screen.getByText("IN PROGRESS")).toBeInTheDocument();
    expect(screen.getByTestId("step-locked-tag-s1")).toBeInTheDocument();
  });

  it("triggers onAdvanceStep for uncompleted steps", () => {
    const handleAdvance = vi.fn();
    render(<Stepper items={steps} onAdvanceStep={handleAdvance} />);

    expect(screen.queryByTestId("advance-step-btn-s1")).not.toBeInTheDocument();
    const advanceBtn = screen.getByTestId("advance-step-btn-s2");
    expect(advanceBtn).toBeInTheDocument();
    fireEvent.click(advanceBtn);
    expect(handleAdvance).toHaveBeenCalledWith("s2");
  });

  it("renders insert affordance and triggers onInsertAfter", () => {
    const handleInsert = vi.fn();
    render(<Stepper items={steps} onInsertAfter={handleInsert} />);

    const insertBtn = screen.getByRole("button", {
      name: "Insert sub-step after Enquiry",
    });
    expect(insertBtn).toBeInTheDocument();

    fireEvent.click(insertBtn);
    expect(handleInsert).toHaveBeenCalledWith("s1");

    const insertAfterSubBtn = screen.getByRole("button", {
      name: "Insert sub-step after Custom Review",
    });
    expect(insertAfterSubBtn).toBeInTheDocument();
    fireEvent.click(insertAfterSubBtn);
    expect(handleInsert).toHaveBeenCalledWith("s-sub");
  });

  it("renders custom sub-step actions for editing and deleting", () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <Stepper
        items={steps}
        onEditCustom={handleEdit}
        onDeleteCustom={handleDelete}
      />
    );

    const editBtn = screen.getByRole("button", { name: "Edit Custom Review" });
    const deleteBtn = screen.getByRole("button", { name: "Delete Custom Review" });

    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith("s-sub");

    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith("s-sub");
  });

  it("renders connector lines and highlights completed connections", () => {
    const stepsWithCompletion: StepperItem[] = [
      { id: "s1", title: "Step 1", status: "COMPLETED", position: 1 },
      { id: "s2", title: "Step 2", status: "COMPLETED", position: 2 },
      { id: "s3", title: "Step 3", status: "IN_PROGRESS", position: 3 },
      { id: "s-sub", title: "Substep", status: "NOT_STARTED", isCustom: true, position: 4 },
      { id: "s4", title: "Step 4", status: "NOT_STARTED", position: 5 },
    ];

    render(<Stepper items={stepsWithCompletion} />);

    const svg1 = screen.getByTestId("connector-svg-s1");
    expect(svg1).toBeInTheDocument();
    const line1 = svg1.querySelector("line");
    expect(line1).toHaveClass(/is-completed/);

    const svg2 = screen.getByTestId("connector-svg-s2");
    expect(svg2).toBeInTheDocument();
    const line2 = svg2.querySelector("line");
    expect(line2).not.toHaveClass(/is-completed/);

    const svg3 = screen.getByTestId("connector-svg-s3");
    expect(svg3).toBeInTheDocument();
    const path3 = svg3.querySelector("path");
    expect(path3).toBeInTheDocument();
    expect(path3).toHaveAttribute("d", "M 13 26 C 13 60, 35 60, 35 100");

    expect(screen.queryByTestId("connector-svg-s4")).not.toBeInTheDocument();
  });

  it("renders custom sub-step with is-substep class and indented positioning", () => {
    render(<Stepper items={steps} />);

    const subStepRow = screen.getByTestId("step-row-s-sub");
    expect(subStepRow).toHaveClass(/is-substep/);

    const subStepIndicator = screen.getByTestId("step-indicator-s-sub");
    expect(subStepIndicator).toHaveClass(/is-substep/);
  });

  it("renders skipped badge and skip reason", () => {
    const skippedSteps: StepperItem[] = [
      {
        id: "s-skip",
        title: "Civil Work",
        status: "SKIPPED",
        position: 1,
        skipReason: "Client handled on-site civil work",
      },
    ];

    render(<Stepper items={skippedSteps} />);

    expect(screen.getByText("Civil Work")).toBeInTheDocument();
    expect(screen.getByText("SKIPPED")).toBeInTheDocument();
    expect(screen.getByTestId("step-skipped-tag-s-skip")).toBeInTheDocument();
    expect(screen.getByTestId("step-skip-reason-s-skip")).toHaveTextContent("Skipped: Client handled on-site civil work");
  });

  it("renders locked placeholder and hides advance button when canAdvanceStep returns false", () => {
    const handleAdvance = vi.fn();
    render(
      <Stepper
        items={steps}
        onAdvanceStep={handleAdvance}
        canAdvanceStep={(s) =>
          s.id === "s3"
            ? { canAdvance: false, reason: "Preceding step must be completed." }
            : { canAdvance: true }
        }
      />
    );

    expect(screen.queryByTestId("advance-step-btn-s3")).not.toBeInTheDocument();
    const lockedS3 = screen.getByTestId("locked-placeholder-s3");
    expect(lockedS3).toBeInTheDocument();
    expect(lockedS3).toHaveAttribute("title", "Preceding step must be completed.");
  });

  it("triggers onSkipStep when skip button is clicked", () => {
    const handleSkip = vi.fn();
    render(
      <Stepper
        items={steps}
        onSkipStep={handleSkip}
        canSkipStep={(s) => s.id === "s3"}
      />
    );

    const skipBtn = screen.getByTestId("skip-step-btn-s3");
    expect(skipBtn).toBeInTheDocument();
    fireEvent.click(skipBtn);
    expect(handleSkip).toHaveBeenCalledWith("s3");
  });
});
