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
def test_admin_timesheet_viewing():
    with time_machine.travel("2026-11-25 10:00:00+05:30"):
        admin1 = User.objects.create_user(
            employee_code="SYS-0001",
            email="admin1@example.com",
            full_name="Admin One",
            role=UserRole.ADMIN,
            password="ValidPassword123!",
        )
        admin2 = User.objects.create_user(
            employee_code="SYS-0002",
            email="admin2@example.com",
            full_name="Admin Two",
            role=UserRole.ADMIN,
            password="ValidPassword123!",
        )
        emp = User.objects.create_user(
            employee_code="SYS-0003",
            email="emp@example.com",
            full_name="Employee Three",
            role=UserRole.EMPLOYEE,
            password="ValidPassword123!",
        )

        project = create_project(
            name="Plant Gamma",
            creator=admin1,
            member_ids=[emp.id, admin1.id],
        )

        monday = datetime.date(2026, 11, 23)
        ts_emp = Timesheet.objects.create(
            employee=emp,
            week_start_date=monday,
            status=TimesheetWeekStatus.SUBMITTED,
        )
        row_emp = TimesheetRow.objects.create(timesheet=ts_emp, project=project)
        TimesheetEntry.objects.create(row=row_emp, date=monday, hours=Decimal("8.00"))

        ts_admin = Timesheet.objects.create(
            employee=admin1,
            week_start_date=monday,
            status=TimesheetWeekStatus.SUBMITTED,
        )

        emp_client = APIClient()
        emp_client.force_login(emp)

        res_forbidden_list = emp_client.get("/api/timesheets/")
        assert res_forbidden_list.status_code == 403

        res_forbidden_pending = emp_client.get("/api/timesheets/pending/")
        assert res_forbidden_pending.status_code == 403

        admin_client = APIClient()
        admin_client.force_login(admin1)

        res_detail = admin_client.get(f"/api/timesheets/?employee={emp.employee_code}&week=2026-11-23")
        assert res_detail.status_code == 200
        detail_data = res_detail.json()
        assert detail_data["employee"]["code"] == "SYS-0003"
        assert detail_data["total_week_hours"] == "8.00"
        assert detail_data["can_approve"] is True

        res_own_detail = admin_client.get(f"/api/timesheets/?employee={admin1.employee_code}&week=2026-11-23")
        assert res_own_detail.status_code == 200
        assert res_own_detail.json()["can_approve"] is False

        res_list = admin_client.get("/api/timesheets/")
        assert res_list.status_code == 200
        assert res_list.json()["count"] == 2

        res_pending = admin_client.get("/api/timesheets/pending/")
        assert res_pending.status_code == 200
        pending_results = res_pending.json()["results"]
        assert len(pending_results) == 2

        emp_pending = next(r for r in pending_results if r["employee"]["code"] == "SYS-0003")
        admin_pending = next(r for r in pending_results if r["employee"]["code"] == "SYS-0001")
        assert emp_pending["can_approve"] is True
        assert admin_pending["can_approve"] is False

        super_client = APIClient()
        session = super_client.session
        session["is_super_admin"] = True
        session["super_admin_username"] = "superadmin"
        session.save()

        res_super_pending = super_client.get("/api/timesheets/pending/")
        assert res_super_pending.status_code == 200
        super_results = res_super_pending.json()["results"]
        for r in super_results:
            assert r["can_approve"] is True
