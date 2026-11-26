import datetime
from decimal import Decimal

import pytest
import time_machine
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.projects.services import create_project
from apps.timesheets.models import (
    Timesheet,
    TimesheetEntry,
    TimesheetRow,
)


@pytest.mark.django_db
def test_own_timesheet_endpoint():
    with time_machine.travel("2026-11-25 10:00:00+05:30"):
        admin = User.objects.create_user(
            employee_code="SYS-0001",
            email="admin@example.com",
            full_name="Admin User",
            role=UserRole.ADMIN,
            password="ValidPassword123!",
        )
        employee = User.objects.create_user(
            employee_code="SYS-0002",
            email="employee@example.com",
            full_name="Employee User",
            role=UserRole.EMPLOYEE,
            password="ValidPassword123!",
        )

        project = create_project(
            name="Turbine Expansion",
            creator=admin,
            member_ids=[employee.id],
        )

        client = APIClient()
        client.force_login(employee)

        res = client.get("/api/timesheets/me/")
        assert res.status_code == 200
        data = res.json()

        assert data["week_start_date"] == "2026-11-23"
        assert data["week_end_date"] == "2026-11-29"
        assert data["status"] == "OPEN"
        assert data["can_edit"] is True
        assert len(data["assigned_projects"]) == 1
        assert data["assigned_projects"][0]["code"] == project.code

        res_specific = client.get("/api/timesheets/me/?week=2026-11-23")
        assert res_specific.status_code == 200
        assert res_specific.json()["week_start_date"] == "2026-11-23"

        res_invalid = client.get("/api/timesheets/me/?week=not-a-date")
        assert res_invalid.status_code == 400

        res_history = client.get("/api/timesheets/me/history/")
        assert res_history.status_code == 200
        history_data = res_history.json()
        assert history_data["count"] >= 1
        assert history_data["results"][0]["week_start_date"] == "2026-11-23"
        assert "week" in res_invalid.json()["fields"]

        super_client = APIClient()
        session = super_client.session
        session["is_super_admin"] = True
        session["super_admin_username"] = "superadmin"
        session.save()

        res_super = super_client.get("/api/timesheets/me/")
        assert res_super.status_code == 403

        ts = Timesheet.objects.get(employee=employee, week_start_date="2026-11-23")
        row = TimesheetRow.objects.create(
            timesheet=ts,
            project=project,
            description="Engineering Design",
        )
        TimesheetEntry.objects.create(
            row=row,
            date=datetime.date(2026, 11, 23),
            hours=Decimal("9.00"),
            note="Full day plus OT",
        )

        res_with_row = client.get("/api/timesheets/me/?week=2026-11-23")
        assert res_with_row.status_code == 200
        row_data = res_with_row.json()
        assert len(row_data["rows"]) == 1
        assert row_data["rows"][0]["row_total"] == "9.00"
        assert row_data["total_week_hours"] == "9.00"
        assert row_data["total_regular_hours"] == "8.00"
        assert row_data["total_overtime_hours"] == "1.00"
