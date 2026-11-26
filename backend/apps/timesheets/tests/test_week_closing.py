import io

import pytest
import time_machine
from django.core.management import call_command
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.audit.models import AuditLog
from apps.timesheets.models import Timesheet, TimesheetWeekStatus


@pytest.mark.django_db
def test_submit_own_timesheet():
    with time_machine.travel("2026-11-25 10:00:00+05:30"):
        emp = User.objects.create_user(
            employee_code="SYS-0001",
            email="emp@example.com",
            full_name="Employee User",
            role=UserRole.EMPLOYEE,
            password="ValidPassword123!",
        )

        client = APIClient()
        client.force_login(emp)

        res = client.post("/api/timesheets/me/submit/", {}, format="json")
        assert res.status_code == 200
        assert res.json()["status"] == "SUBMITTED"
        assert res.json()["submitted_at"] is not None

        ts = Timesheet.objects.get(employee=emp, week_start_date="2026-11-23")
        assert ts.status == TimesheetWeekStatus.SUBMITTED
        assert AuditLog.objects.filter(action="TIMESHEET_SUBMIT", entity_id=str(ts.id)).exists()

        res_repeat = client.post("/api/timesheets/me/submit/", {}, format="json")
        assert res_repeat.status_code == 400


@pytest.mark.django_db
def test_close_weeks_command():
    with time_machine.travel("2026-11-25 10:00:00+05:30"):
        emp = User.objects.create_user(
            employee_code="SYS-0002",
            email="emp2@example.com",
            full_name="Employee Two",
            role=UserRole.EMPLOYEE,
            password="ValidPassword123!",
        )

        past_ts = Timesheet.objects.create(
            employee=emp,
            week_start_date="2026-11-16",
            status=TimesheetWeekStatus.OPEN,
        )
        current_ts = Timesheet.objects.create(
            employee=emp,
            week_start_date="2026-11-23",
            status=TimesheetWeekStatus.OPEN,
        )

        out = io.StringIO()
        call_command("close_weeks", "--dry-run", stdout=out)
        assert "DRY RUN" in out.getvalue()
        past_ts.refresh_from_db()
        assert past_ts.status == TimesheetWeekStatus.OPEN

        out_live = io.StringIO()
        call_command("close_weeks", stdout=out_live)
        assert "Closed 1" in out_live.getvalue()

        past_ts.refresh_from_db()
        current_ts.refresh_from_db()
        assert past_ts.status == TimesheetWeekStatus.SUBMITTED
        assert current_ts.status == TimesheetWeekStatus.OPEN
        assert AuditLog.objects.filter(
            action="TIMESHEET_AUTO_SUBMIT", entity_id=str(past_ts.id)
        ).exists()
