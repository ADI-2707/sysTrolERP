import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "./api";
import { App } from "./App";

describe("App Root", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders and redirects to /login when unauthenticated", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue({
      name: "ApiClientError",
      status: 401,
      code: "authentication_failed",
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    });
  });
});
