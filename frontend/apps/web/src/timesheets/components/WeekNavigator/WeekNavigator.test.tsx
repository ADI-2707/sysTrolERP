import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WeekNavigator } from "./WeekNavigator";

describe("WeekNavigator", () => {
  it("renders display range and current week badge", () => {
    render(
      <WeekNavigator
        monday="2026-11-23"
        sunday="2026-11-29"
        displayRange="23 - 29 Nov 2026"
        isCurrent={true}
        onPrevious={() => {}}
        onNext={() => {}}
        onCurrentWeek={() => {}}
      />
    );

    expect(screen.getByText("23 - 29 Nov 2026")).toBeInTheDocument();
    expect(screen.getByText("Current Week")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "This Week" })).toBeDisabled();
  });

  it("handles previous, next, and current week navigation callbacks", () => {
    const handlePrevious = vi.fn();
    const handleNext = vi.fn();
    const handleCurrent = vi.fn();

    render(
      <WeekNavigator
        monday="2026-11-16"
        sunday="2026-11-22"
        displayRange="16 - 22 Nov 2026"
        isCurrent={false}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onCurrentWeek={handleCurrent}
      />
    );

    expect(screen.queryByText("Current Week")).not.toBeInTheDocument();
    const thisWeekBtn = screen.getByRole("button", { name: "This Week" });
    expect(thisWeekBtn).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    expect(handlePrevious).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    expect(handleNext).toHaveBeenCalledTimes(1);

    fireEvent.click(thisWeekBtn);
    expect(handleCurrent).toHaveBeenCalledTimes(1);
  });
});
