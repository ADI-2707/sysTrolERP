export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekBounds(dateInput?: string | Date): { monday: string; sunday: string; days: string[] } {
  let target: Date;
  if (!dateInput) {
    const now = new Date();
    target = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  } else if (typeof dateInput === "string") {
    target = parseIsoDate(dateInput);
  } else {
    target = new Date(Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate()));
  }

  const dayOfWeek = target.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const mondayDate = new Date(target);
  mondayDate.setUTCDate(target.getUTCDate() + diffToMonday);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(mondayDate);
    currentDay.setUTCDate(mondayDate.getUTCDate() + i);
    days.push(formatIsoDate(currentDay));
  }

  return {
    monday: days[0],
    sunday: days[6],
    days,
  };
}

export function addWeeks(mondayStr: string, weeks: number): string {
  const monday = parseIsoDate(mondayStr);
  monday.setUTCDate(monday.getUTCDate() + weeks * 7);
  return formatIsoDate(monday);
}

export function formatWeekDisplay(mondayStr: string, sundayStr: string): string {
  const mon = parseIsoDate(mondayStr);
  const sun = parseIsoDate(sundayStr);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monDay = mon.getUTCDate();
  const monMonth = monthNames[mon.getUTCMonth()];
  const monYear = mon.getUTCFullYear();

  const sunDay = sun.getUTCDate();
  const sunMonth = monthNames[sun.getUTCMonth()];
  const sunYear = sun.getUTCFullYear();

  if (monYear === sunYear && monMonth === sunMonth) {
    return `${monDay} - ${sunDay} ${monMonth} ${monYear}`;
  }
  if (monYear === sunYear) {
    return `${monDay} ${monMonth} - ${sunDay} ${sunMonth} ${monYear}`;
  }
  return `${monDay} ${monMonth} ${monYear} - ${sunDay} ${sunMonth} ${sunYear}`;
}

export function isCurrentWeek(mondayStr: string): boolean {
  const currentBounds = getWeekBounds();
  return currentBounds.monday === mondayStr;
}

export function getDayLabel(isoDate: string): { dayName: string; dayNumber: number; formatted: string } {
  const date = parseIsoDate(isoDate);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = dayNames[date.getUTCDay()];
  const dayNumber = date.getUTCDate();
  return {
    dayName,
    dayNumber,
    formatted: `${dayName} ${dayNumber}`,
  };
}
