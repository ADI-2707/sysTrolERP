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
    TimesheetRow,
    TimesheetWeekStatus,
)

@pytest.mark.django_db
def test_timesheet_summary_cards():
    with time_machine.travel("2026-11-25 10:00:00+05:30"):
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
            name="Power Plant",
            creator=admin,
            member_ids=[emp1.id, emp2.id],
        )

        monday = datetime.date(2026, 11, 23)
        ts1 = Timesheet.objects.create(
            employee=emp1,
            week_start_date=monday,
            status=TimesheetWeekStatus.SUBMITTED,
        )
        row1 = TimesheetRow.objects.create(timesheet=ts1, project=project)
        TimesheetEntry.objects.create(row=row1, date=monday, hours=Decimal("10.00"))

        ts2 = Timesheet.objects.create(
            employee=emp2,
            week_start_date=monday,
            status=TimesheetWeekStatus.APPROVED,
        )
        row2 = TimesheetRow.objects.create(timesheet=ts2, project=project)
        TimesheetEntry.objects.create(row=row2, date=monday, hours=Decimal("8.00"))

        client_emp = APIClient()
        client_emp.force_login(emp1)
        res_emp = client_emp.get("/api/timesheets/summary/")
        assert res_emp.status_code == 403

        client_admin = APIClient()
        client_admin.force_login(admin)
        res_admin = client_admin.get("/api/timesheets/summary/")
        assert res_admin.status_code == 200
        data = res_admin.json()

        assert data["active_employees_count"] == 3
        assert data["pending_approval_count"] == 1
        assert data["week_submitted_count"] == 1
        assert data["week_approved_count"] == 1
        assert data["total_hours"] == "18.00"
        assert data["total_regular_hours"] == "16.00"
        assert data["total_overtime_hours"] == "2.00"
