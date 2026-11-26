import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useWeekNavigation } from "./useWeekNavigation";
import { getWeekBounds, addWeeks } from "../utils/dateUtils";

describe("useWeekNavigation", () => {
  it("initializes to current week bounds and does not allow navigating to future weeks", () => {
    const currentMonday = getWeekBounds().monday;
    const { result } = renderHook(() => useWeekNavigation(currentMonday));

    expect(result.current.monday).toBe(currentMonday);
    expect(result.current.isCurrent).toBe(true);
    expect(result.current.canGoNext).toBe(false);

    // Attempting to go to next week should do nothing because it is in the future
    act(() => {
      result.current.goToNextWeek();
    });
    expect(result.current.monday).toBe(currentMonday);
  });

  it("navigates to previous week and allows going back to current week", () => {
    const currentMonday = getWeekBounds().monday;
    const prevMonday = addWeeks(currentMonday, -1);
    const { result } = renderHook(() => useWeekNavigation(prevMonday));

    expect(result.current.monday).toBe(prevMonday);
    expect(result.current.isCurrent).toBe(false);
    expect(result.current.canGoNext).toBe(true);

    // Go next should return to current week
    act(() => {
      result.current.goToNextWeek();
    });
    expect(result.current.monday).toBe(currentMonday);
    expect(result.current.canGoNext).toBe(false);
  });
});
