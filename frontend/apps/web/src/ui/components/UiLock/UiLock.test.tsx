import { render, screen, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UiLock } from "./UiLock";
import { UiLockProvider, useUiLock } from "./UiLockContext";

describe("UiLock component", () => {
  it("renders when active is true with role='status'", () => {
    render(<UiLock active={true} message="Saving changes..." />);
    const overlay = screen.getByRole("status");
    expect(overlay).toBeInTheDocument();
    expect(screen.getByText("Saving changes...")).toBeInTheDocument();
    expect(screen.getByRole("img", { hidden: true })).toHaveAttribute("src", "/logo-collapsed.png");
  });

  it("does not render when active is false and no children provided", () => {
    const { container } = render(<UiLock active={false} message="Idle" />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders children and shows overlay when active is true in container mode", () => {
    render(
      <UiLock active={true} fullScreen={false} message="Loading table...">
        <div data-testid="child-content">Table Content</div>
      </UiLock>
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading table...")).toBeInTheDocument();
  });

  it("renders children without overlay when active is false in container mode", () => {
    render(
      <UiLock active={false} fullScreen={false}>
        <div data-testid="child-content">Table Content</div>
      </UiLock>
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("applies size classes for sm, md, and lg variants", () => {
    const { rerender } = render(<UiLock active={true} size="sm" message="Small lock" />);
    expect(screen.getByRole("status").firstElementChild?.className).toContain("size-sm");

    rerender(<UiLock active={true} size="lg" message="Large lock" />);
    expect(screen.getByRole("status").firstElementChild?.className).toContain("size-lg");
  });

  it("works with UiLockProvider and useUiLock hook imperatively", () => {
    function TestConsumer() {
      const { isLocked, lock, unlock } = useUiLock();
      return (
        <div>
          <button onClick={() => lock("Global lock active")}>Lock</button>
          <button onClick={() => unlock()}>Unlock</button>
          <span data-testid="lock-state">{isLocked ? "LOCKED" : "UNLOCKED"}</span>
        </div>
      );
    }

    render(
      <UiLockProvider>
        <TestConsumer />
      </UiLockProvider>
    );

    expect(screen.getByTestId("lock-state")).toHaveTextContent("UNLOCKED");
    expect(screen.queryByText("Global lock active")).not.toBeInTheDocument();

    act(() => {
      screen.getByText("Lock").click();
    });

    expect(screen.getByTestId("lock-state")).toHaveTextContent("LOCKED");
    expect(screen.getByText("Global lock active")).toBeInTheDocument();

    act(() => {
      screen.getByText("Unlock").click();
    });

    expect(screen.getByTestId("lock-state")).toHaveTextContent("UNLOCKED");
    expect(screen.queryByText("Global lock active")).not.toBeInTheDocument();
  });
});
