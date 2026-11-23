import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DropdownMenu } from "./DropdownMenu";
import { Popover } from "./Popover";
import { Tooltip } from "./Tooltip";

describe("Overlay components", () => {
  it("renders Tooltip on hover", async () => {
    render(
      <Tooltip content="Tooltip info" delay={0}>
        <button>Hover me</button>
      </Tooltip>
    );

    const btn = screen.getByRole("button", { name: "Hover me" });
    fireEvent.mouseEnter(btn.parentElement!);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Tooltip info");

    fireEvent.mouseLeave(btn.parentElement!);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("opens Popover on click and closes on escape", () => {
    render(
      <Popover
        trigger={<button>Open Popover</button>}
        content={<div>Popover Details</div>}
      />
    );

    const trigger = screen.getByRole("button", { name: "Open Popover" });
    fireEvent.click(trigger);
    expect(screen.getByText("Popover Details")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Popover Details")).not.toBeInTheDocument();
  });

  it("opens DropdownMenu and triggers item click", () => {
    const handleEdit = vi.fn();
    const items = [
      { key: "edit", label: "Edit Item", onClick: handleEdit },
      { key: "delete", label: "Delete Item", danger: true },
    ];

    render(
      <DropdownMenu
        trigger={<button>Actions</button>}
        items={items}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    const editBtn = screen.getByRole("menuitem", { name: "Edit Item" });
    expect(editBtn).toBeInTheDocument();

    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menuitem", { name: "Edit Item" })).not.toBeInTheDocument();
  });
});
