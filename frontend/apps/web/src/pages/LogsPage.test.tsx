import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LogsPage } from "./LogsPage";

function renderLogsPage(initialEntry = "/audit") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/audit" element={<LogsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("LogsPage Structure", () => {
  it("renders page header and all 5 tabs defaulting to Audit", () => {
    renderLogsPage();

    expect(screen.getByTestId("logs-page")).toBeInTheDocument();
    expect(screen.getByText("System Logs & Audit")).toBeInTheDocument();

    expect(screen.getByRole("tab", { name: /Audit/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Requests/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Errors/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Auth/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Telemetry/i })).toBeInTheDocument();

    expect(screen.getByTestId("audit-tab-panel")).toBeInTheDocument();
    expect(screen.getByTestId("logs-filter-bar")).toBeInTheDocument();
  });

  it("switches tabs and displays respective tab panels", () => {
    renderLogsPage("/audit");

    const requestsTab = screen.getByRole("tab", { name: /Requests/i });
    fireEvent.click(requestsTab);
    expect(screen.getByTestId("requests-tab-panel")).toBeInTheDocument();
    expect(screen.getByTestId("logs-method-filter")).toBeInTheDocument();
    expect(screen.getByTestId("logs-status-filter")).toBeInTheDocument();

    const errorsTab = screen.getByRole("tab", { name: /Errors/i });
    fireEvent.click(errorsTab);
    expect(screen.getByTestId("errors-tab-panel")).toBeInTheDocument();
    expect(screen.getByTestId("logs-error-class-filter")).toBeInTheDocument();

    const authTab = screen.getByRole("tab", { name: /Auth/i });
    fireEvent.click(authTab);
    expect(screen.getByTestId("auth-tab-panel")).toBeInTheDocument();
    expect(screen.getByTestId("logs-auth-action-filter")).toBeInTheDocument();

    const telemetryTab = screen.getByRole("tab", { name: /Telemetry/i });
    fireEvent.click(telemetryTab);
    expect(screen.getByTestId("telemetry-tab-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("logs-filter-bar")).not.toBeInTheDocument();
  });

  it("binds filter inputs to URL parameters and allows clearing filters", () => {
    renderLogsPage("/audit");

    const searchInput = screen.getByTestId("logs-search-input") as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: "EMPLOYEE_CREATE" } });
    expect(searchInput.value).toBe("EMPLOYEE_CREATE");

    const startDate = screen.getByTestId("logs-start-date") as HTMLInputElement;
    fireEvent.change(startDate, { target: { value: "2026-03-01" } });
    expect(startDate.value).toBe("2026-03-01");

    const endDate = screen.getByTestId("logs-end-date") as HTMLInputElement;
    fireEvent.change(endDate, { target: { value: "2026-03-05" } });
    expect(endDate.value).toBe("2026-03-05");

    const actionFilter = screen.getByTestId("logs-action-filter") as HTMLSelectElement;
    fireEvent.change(actionFilter, { target: { value: "PROJECT_CREATE" } });
    expect(actionFilter.value).toBe("PROJECT_CREATE");

    const clearBtn = screen.getByTestId("logs-clear-filters-btn");
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);

    expect(screen.queryByTestId("logs-clear-filters-btn")).not.toBeInTheDocument();
    expect((screen.getByTestId("logs-search-input") as HTMLInputElement).value).toBe("");
  });
});
