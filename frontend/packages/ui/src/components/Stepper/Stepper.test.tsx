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
});
