import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { ToastProvider } from "@systrol/ui";
import { apiClient } from "../../api";

const mockRefreshUser = vi.fn();

vi.mock("../../auth", () => ({
  useAuth: () => ({
    refreshUser: mockRefreshUser,
  }),
}));

vi.mock("../../api", () => ({
  apiClient: {
    post: vi.fn(),
  },
  ApiClientError: class ApiClientError extends Error {
    fields?: Record<string, string[]>;
    constructor(message: string, fields?: Record<string, string[]>) {
      super(message);
      this.fields = fields;
    }
  },
}));

function renderForm(onSuccess?: () => void) {
  return render(
    <ToastProvider>
      <ChangePasswordForm onSuccess={onSuccess} />
    </ToastProvider>
  );
}

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form inputs and initially disabled submit button", () => {
    renderForm();

    expect(screen.getByTestId("change-password-form")).toBeInTheDocument();
    expect(screen.getByTestId("input-current-password")).toBeInTheDocument();
    expect(screen.getByTestId("input-new-password")).toBeInTheDocument();
    expect(screen.getByTestId("input-confirm-password")).toBeInTheDocument();

    const submitBtn = screen.getByTestId("submit-change-password-btn");
    expect(submitBtn).toBeDisabled();
  });

  it("dynamically computes strength meter and checklist rules as user types", () => {
    renderForm();

    const newPwdInput = screen.getByTestId("input-new-password");

    fireEvent.change(newPwdInput, { target: { value: "weak" } });
    expect(screen.getByTestId("password-strength-label")).toHaveTextContent("Weak");
    expect(screen.getByTestId("rule-min-length")).not.toHaveClass("rulePassed");

    fireEvent.change(newPwdInput, { target: { value: "Password12" } });
    expect(screen.getByTestId("password-strength-label")).toHaveTextContent("Good");
    expect(screen.getByTestId("rule-min-length")).toHaveTextContent("✓");
    expect(screen.getByTestId("rule-mixed-case")).toHaveTextContent("✓");
    expect(screen.getByTestId("rule-number")).toHaveTextContent("✓");
    expect(screen.getByTestId("rule-special-char")).toHaveTextContent("○");

    fireEvent.change(newPwdInput, { target: { value: "Password123!" } });
    expect(screen.getByTestId("password-strength-label")).toHaveTextContent("Strong");
    expect(screen.getByTestId("rule-special-char")).toHaveTextContent("✓");
  });

  it("enables submit when all rules pass and submits successfully", async () => {
    const onSuccessMock = vi.fn();
    vi.mocked(apiClient.post).mockResolvedValueOnce({ message: "Password updated" });

    renderForm(onSuccessMock);

    const currentPwdInput = screen.getByTestId("input-current-password");
    const newPwdInput = screen.getByTestId("input-new-password");
    const confirmPwdInput = screen.getByTestId("input-confirm-password");
    const submitBtn = screen.getByTestId("submit-change-password-btn");

    fireEvent.change(currentPwdInput, { target: { value: "CurrentSecret1!" } });
    fireEvent.change(newPwdInput, { target: { value: "NewSecret10!#" } });
    fireEvent.change(confirmPwdInput, { target: { value: "NewSecret10!#" } });

    expect(screen.getByTestId("rule-match")).toHaveTextContent("✓");
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/api/auth/password/change", {
        current_password: "CurrentSecret1!",
        new_password: "NewSecret10!#",
        confirm_password: "NewSecret10!#",
      });
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(onSuccessMock).toHaveBeenCalled();
    });

    expect(currentPwdInput).toHaveValue("");
    expect(newPwdInput).toHaveValue("");
    expect(confirmPwdInput).toHaveValue("");
  });

  it("displays server error message on failure", async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(
      new Error("Current password is incorrect.")
    );

    renderForm();

    const currentPwdInput = screen.getByTestId("input-current-password");
    const newPwdInput = screen.getByTestId("input-new-password");
    const confirmPwdInput = screen.getByTestId("input-confirm-password");
    const submitBtn = screen.getByTestId("submit-change-password-btn");

    fireEvent.change(currentPwdInput, { target: { value: "WrongPassword1!" } });
    fireEvent.change(newPwdInput, { target: { value: "NewSecret10!#" } });
    fireEvent.change(confirmPwdInput, { target: { value: "NewSecret10!#" } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("change-password-error")).toBeInTheDocument();
      expect(screen.getByText("Current password is incorrect.")).toBeInTheDocument();
    });
  });
});
