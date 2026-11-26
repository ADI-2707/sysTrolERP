import { useState, useMemo, useCallback } from "react";
import {
  getWeekBounds,
  addWeeks,
  formatWeekDisplay,
  isCurrentWeek as checkIsCurrentWeek,
} from "../utils/dateUtils";

export function useWeekNavigation(initialDate?: string) {
  const [selectedMonday, setSelectedMonday] = useState(() => {
    return getWeekBounds(initialDate).monday;
  });

  const bounds = useMemo(() => {
    return getWeekBounds(selectedMonday);
  }, [selectedMonday]);

  const displayRange = useMemo(() => {
    return formatWeekDisplay(bounds.monday, bounds.sunday);
  }, [bounds]);

  const isCurrent = useMemo(() => {
    return checkIsCurrentWeek(bounds.monday);
  }, [bounds.monday]);

  const currentMonday = useMemo(() => getWeekBounds().monday, []);

  const canGoNext = useMemo(() => {
    return bounds.monday < currentMonday;
  }, [bounds.monday, currentMonday]);

  const goToPreviousWeek = useCallback(() => {
    setSelectedMonday((prev) => addWeeks(prev, -1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setSelectedMonday((prev) => {
      const nextMonday = addWeeks(prev, 1);
      if (nextMonday > currentMonday) {
        return prev;
      }
      return nextMonday;
    });
  }, [currentMonday]);

  const goToCurrentWeek = useCallback(() => {
    setSelectedMonday(currentMonday);
  }, [currentMonday]);

  const setWeek = useCallback((dateStr: string) => {
    const targetMonday = getWeekBounds(dateStr).monday;
    if (targetMonday > currentMonday) {
      setSelectedMonday(currentMonday);
    } else {
      setSelectedMonday(targetMonday);
    }
  }, [currentMonday]);

  return {
    monday: bounds.monday,
    sunday: bounds.sunday,
    days: bounds.days,
    isCurrent,
    canGoNext,
    displayRange,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    setWeek,
  };
}
