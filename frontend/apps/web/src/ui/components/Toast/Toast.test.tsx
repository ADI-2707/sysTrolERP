import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToastProvider, useToast } from "./ToastContext";

function TestToastConsumer() {
  const { toast, toasts } = useToast();
  return (
    <div>
      <button onClick={() => toast.success("Changes saved")}>Trigger Success</button>
      <button onClick={() => toast.error("Failed to save")}>Trigger Error</button>
      <button
        onClick={() =>
          toast.promise(
            new Promise((resolve) => setTimeout(resolve, 50)),
            { loading: "Loading data...", success: "Data loaded", error: "Error" }
          )
        }
      >
        Trigger Promise
      </button>
      <span data-testid="count">{toasts.length}</span>
    </div>
  );
}

describe("Toast system", () => {
  it("renders toast notifications and aria-live region", async () => {
    render(
      <ToastProvider>
        <TestToastConsumer />
      </ToastProvider>
    );

    expect(screen.getByRole("region", { name: "Notifications" })).toBeInTheDocument();

    fireEvent.click(screen.getByText("Trigger Success"));
    expect(screen.getByText("Changes saved")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "Dismiss notification" });
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByText("Changes saved")).not.toBeInTheDocument();
    });
  });

  it("handles promise toast resolution", async () => {
    render(
      <ToastProvider>
        <TestToastConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Trigger Promise"));
    expect(screen.getByText("Loading data...")).toBeInTheDocument();

    await new Promise((resolve) => setTimeout(resolve, 70));
    expect(screen.getByText("Data loaded")).toBeInTheDocument();
  });

  it("renders countdown progress bar when duration is positive", () => {
    render(
      <ToastProvider>
        <TestToastConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Trigger Success"));
    expect(screen.getByTestId("toast-progress-bar")).toBeInTheDocument();
  });
});
