import datetime

import time_machine

from apps.timesheets.models import TimesheetWeekStatus
from apps.timesheets.rules import can_edit_week, is_cell_editable


def test_cell_and_week_editability_with_time_machine():
    with time_machine.travel("2026-11-25 14:00:00+05:30"):
        today = datetime.date(2026, 11, 25)
        monday = datetime.date(2026, 11, 23)
        tuesday = datetime.date(2026, 11, 24)
        wednesday = datetime.date(2026, 11, 25)
        thursday = datetime.date(2026, 11, 26)
        sunday = datetime.date(2026, 11, 29)

        assert can_edit_week(week_start_date=monday, status=TimesheetWeekStatus.OPEN) is True
        assert can_edit_week(week_start_date=monday, status=TimesheetWeekStatus.SUBMITTED) is False
        assert can_edit_week(week_start_date=monday, status=TimesheetWeekStatus.APPROVED) is False
        assert can_edit_week(week_start_date=monday, status=TimesheetWeekStatus.RETURNED) is True

        future_monday = datetime.date(2026, 11, 30)
        assert (
            can_edit_week(week_start_date=future_monday, status=TimesheetWeekStatus.OPEN) is False
        )

        assert (
            is_cell_editable(
                cell_date=monday,
                week_start_date=monday,
                week_status=TimesheetWeekStatus.OPEN,
                project_is_active=True,
                is_assigned=True,
            )
            is True
        )

        assert (
            is_cell_editable(
                cell_date=tuesday,
                week_start_date=monday,
                week_status=TimesheetWeekStatus.OPEN,
                project_is_active=True,
                is_assigned=True,
            )
            is True
        )

        assert (
            is_cell_editable(
                cell_date=wednesday,
                week_start_date=monday,
                week_status=TimesheetWeekStatus.OPEN,
                project_is_active=True,
                is_assigned=True,
            )
            is True
        )

        assert (
            is_cell_editable(
                cell_date=thursday,
                week_start_date=monday,
                week_status=TimesheetWeekStatus.OPEN,
                project_is_active=True,
                is_assigned=True,
            )
            is False
        )

        assert (
            is_cell_editable(
                cell_date=sunday,
                week_start_date=monday,
                week_status=TimesheetWeekStatus.OPEN,
                project_is_active=True,
                is_assigned=True,
            )
            is False
        )

        assert (
            is_cell_editable(
                cell_date=monday,
                week_start_date=monday,
                week_status=TimesheetWeekStatus.OPEN,
                project_is_active=False,
                is_assigned=True,
            )
            is False
        )

        assert (
            is_cell_editable(
                cell_date=monday,
                week_start_date=monday,
                week_status=TimesheetWeekStatus.SUBMITTED,
                project_is_active=True,
                is_assigned=True,
            )
            is False
        )

        assert (
            is_cell_editable(
                cell_date=monday,
                week_start_date=monday,
                week_status=TimesheetWeekStatus.APPROVED,
                project_is_active=True,
                is_assigned=True,
            )
            is False
        )

        past_monday = datetime.date(2026, 11, 16)
        past_thursday = datetime.date(2026, 11, 19)

        assert (
            is_cell_editable(
                cell_date=past_thursday,
                week_start_date=past_monday,
                week_status=TimesheetWeekStatus.OPEN,
                project_is_active=True,
                is_assigned=True,
            )
            is False
        )

        assert (
            is_cell_editable(
                cell_date=past_thursday,
                week_start_date=past_monday,
                week_status=TimesheetWeekStatus.RETURNED,
                project_is_active=True,
                is_assigned=True,
            )
            is True
        )

        assert (
            can_edit_week(week_start_date=past_monday, status=TimesheetWeekStatus.RETURNED) is True
        )

        mismatched_cell_date = datetime.date(2026, 11, 10)
        assert (
            is_cell_editable(
                cell_date=mismatched_cell_date,
                week_start_date=past_monday,
                week_status=TimesheetWeekStatus.RETURNED,
                project_is_active=True,
                is_assigned=True,
            )
            is False
        )
