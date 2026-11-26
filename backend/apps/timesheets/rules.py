import datetime

from apps.core.timezone import company_today, week_bounds
from apps.timesheets.models import TimesheetWeekStatus


def can_edit_week(
    *,
    week_start_date: datetime.date,
    status: str,
    today: datetime.date | None = None,
) -> bool:
    if today is None:
        today = company_today()

    current_monday, _ = week_bounds(today)

    if status == TimesheetWeekStatus.OPEN:
        return week_start_date == current_monday
    elif status == TimesheetWeekStatus.RETURNED:
        return week_start_date <= current_monday
    return False


def is_cell_editable(
    *,
    cell_date: datetime.date,
    week_start_date: datetime.date,
    week_status: str,
    project_is_active: bool,
    is_assigned: bool = True,
    today: datetime.date | None = None,
) -> bool:
    if today is None:
        today = company_today()

    current_monday, _ = week_bounds(today)

    if cell_date > today:
        return False

    if not project_is_active:
        return False

    if week_status not in (TimesheetWeekStatus.OPEN, TimesheetWeekStatus.RETURNED):
        return False

    week_end_date = week_start_date + datetime.timedelta(days=6)
    if not (week_start_date <= cell_date <= week_end_date):
        return False

    if week_status == TimesheetWeekStatus.OPEN:
        if week_start_date != current_monday:
            return False

    return True
