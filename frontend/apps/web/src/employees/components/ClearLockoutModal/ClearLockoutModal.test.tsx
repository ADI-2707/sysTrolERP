import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ClearLockoutModal } from "./ClearLockoutModal";

describe("ClearLockoutModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders inputs pre-filled with default identifier", () => {
    render(
      <ClearLockoutModal
        isOpen={true}
        onClose={mockOnClose}
        defaultIdentifier="locked@example.com"
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByTestId("clear-lockout-form")).toBeInTheDocument();
    expect(screen.getByDisplayValue("locked@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("lockout-ip-input")).toBeInTheDocument();
  });

  it("requires identifier before submission", () => {
    render(
      <ClearLockoutModal
        isOpen={true}
        onClose={mockOnClose}
        defaultIdentifier=""
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.submit(screen.getByTestId("clear-lockout-form"));

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId("clear-lockout-error")).toHaveTextContent("Account identifier or email is required.");
  });

  it("submits identifier and optional IP address successfully", async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(
      <ClearLockoutModal
        isOpen={true}
        onClose={mockOnClose}
        defaultIdentifier=""
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.change(screen.getByTestId("lockout-identifier-input"), {
      target: { value: "operator@systrol.local" },
    });
    fireEvent.change(screen.getByTestId("lockout-ip-input"), {
      target: { value: "192.168.1.50" },
    });

    fireEvent.click(screen.getByTestId("clear-lockout-submit-btn"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith("operator@systrol.local", "192.168.1.50");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("displays server error message on failure", async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error("Unable to clear lockout."));

    render(
      <ClearLockoutModal
        isOpen={true}
        onClose={mockOnClose}
        defaultIdentifier="user@example.com"
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByTestId("clear-lockout-submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("clear-lockout-error")).toHaveTextContent("Unable to clear lockout.");
    });
  });

  it("closes when cancel button is clicked", () => {
    render(
      <ClearLockoutModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByTestId("clear-lockout-cancel-btn"));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
