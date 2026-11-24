import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";
import { Drawer } from "./Drawer";
import { Modal } from "./Modal";

describe("Modal, ConfirmDialog and Drawer components", () => {
  it("renders Modal when open and responds to close", () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={false} onClose={handleClose} title="Project Settings">
        Modal Content
      </Modal>
    );

    expect(screen.queryByText("Project Settings")).not.toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={handleClose} title="Project Settings">
        Modal Content
      </Modal>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Modal Content")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "Close dialog" });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("triggers onConfirm in ConfirmDialog", () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Revoke Access"
        description="Are you sure you want to revoke this user?"
        variant="danger"
        confirmText="Revoke"
      />
    );

    expect(screen.getByText("Are you sure you want to revoke this user?")).toBeInTheDocument();
    const confirmBtn = screen.getByRole("button", { name: "Revoke" });
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("renders Drawer and handles close", () => {
    const handleClose = vi.fn();
    render(
      <Drawer isOpen={true} onClose={handleClose} title="Filters" side="right">
        <div>Filter options</div>
      </Drawer>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Filter options")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "Close drawer" });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
