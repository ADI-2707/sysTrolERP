import datetime
from decimal import Decimal
import pytest
from rest_framework.test import APIClient
import time_machine
from apps.accounts.models import User, UserRole
from apps.projects.services import create_project
from apps.timesheets.models import (
    Timesheet,
    TimesheetEntry,
    TimesheetWeekStatus,
)

@pytest.mark.django_db
def test_cell_upsert_lifecycle():
    with time_machine.travel("2026-11-25 14:00:00+05:30"):
        admin = User.objects.create_user(
            employee_code="SYS-0001",
            email="admin@example.com",
            full_name="Admin User",
            role=UserRole.ADMIN,
            password="ValidPassword123!",
        )
        emp1 = User.objects.create_user(
            employee_code="SYS-0002",
            email="emp1@example.com",
            full_name="Employee One",
            role=UserRole.EMPLOYEE,
            password="ValidPassword123!",
        )
        emp2 = User.objects.create_user(
            employee_code="SYS-0003",
            email="emp2@example.com",
            full_name="Employee Two",
            role=UserRole.EMPLOYEE,
            password="ValidPassword123!",
        )

        project = create_project(
            name="Power Substation",
            creator=admin,
            member_ids=[emp1.id],
        )

        inactive_project = create_project(
            name="Inactive Project",
            creator=admin,
        )
        inactive_project.is_active = False
        inactive_project.save()

        client = APIClient()
        client.force_login(emp1)

        res_inactive = client.put(
            "/api/timesheets/me/cells/",
            {
                "project_id": inactive_project.id,
                "date": "2026-11-23",
                "hours": "8.00",
            },
            format="json",
        )
        assert res_inactive.status_code == 400

        res_future = client.put(
            "/api/timesheets/me/cells/",
            {
                "project_id": project.id,
                "date": "2026-11-27",
                "hours": "8.00",
            },
            format="json",
        )
        assert res_future.status_code == 400

        res_invalid_step = client.put(
            "/api/timesheets/me/cells/",
            {
                "project_id": project.id,
                "date": "2026-11-23",
                "hours": "8.10",
            },
            format="json",
        )
        assert res_invalid_step.status_code == 400

        res_create = client.put(
            "/api/timesheets/me/cells/",
            {
                "project_id": project.id,
                "date": "2026-11-23",
                "hours": "8.00",
                "note": "Initial development",
            },
            format="json",
        )
        assert res_create.status_code == 200
        data = res_create.json()
        assert data["hours"] == "8.00"
        assert data["row_total"] == "8.00"
        assert data["day_total"] == "8.00"
        assert data["total_week_hours"] == "8.00"

        entry = TimesheetEntry.objects.get(row__project=project, date="2026-11-23")
        assert entry.hours == Decimal("8.00")
        assert entry.note == "Initial development"

        res_update = client.put(
            "/api/timesheets/me/cells/",
            {
                "project_id": project.id,
                "date": "2026-11-23",
                "hours": "9.50",
                "note": "Overtime update",
            },
            format="json",
        )
        assert res_update.status_code == 200
        assert res_update.json()["hours"] == "9.50"
        assert res_update.json()["row_total"] == "9.50"

        entry.refresh_from_db()
        assert entry.hours == Decimal("9.50")
        assert entry.note == "Overtime update"

        res_zero = client.put(
            "/api/timesheets/me/cells/",
            {
                "project_id": project.id,
                "date": "2026-11-23",
                "hours": "0.00",
            },
            format="json",
        )
        assert res_zero.status_code == 200
        assert res_zero.json()["hours"] == "0.00"
        assert res_zero.json()["row_total"] == "0.00"
        assert not TimesheetEntry.objects.filter(row__project=project, date="2026-11-23").exists()

        ts = Timesheet.objects.get(employee=emp1, week_start_date="2026-11-23")
        ts.status = TimesheetWeekStatus.SUBMITTED
        ts.save()

        res_submitted = client.put(
            "/api/timesheets/me/cells/",
            {
                "project_id": project.id,
                "date": "2026-11-24",
                "hours": "8.00",
            },
            format="json",
        )
        assert res_submitted.status_code == 400
