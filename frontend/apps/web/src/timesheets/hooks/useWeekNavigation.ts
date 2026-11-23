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

  const goToPreviousWeek = useCallback(() => {
    setSelectedMonday((prev) => addWeeks(prev, -1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setSelectedMonday((prev) => addWeeks(prev, 1));
  }, []);

  const goToCurrentWeek = useCallback(() => {
    setSelectedMonday(getWeekBounds().monday);
  }, []);

  const setWeek = useCallback((dateStr: string) => {
    setSelectedMonday(getWeekBounds(dateStr).monday);
  }, []);

  return {
    monday: bounds.monday,
    sunday: bounds.sunday,
    days: bounds.days,
    isCurrent,
    displayRange,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    setWeek,
  };
}
