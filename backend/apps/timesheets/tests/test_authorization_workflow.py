import datetime

import pytest
import time_machine
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.audit.models import AuditLog
from apps.timesheets.models import (
    Timesheet,
    TimesheetWeekStatus,
)


@pytest.mark.django_db
def test_authorization_workflow():
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

        monday = datetime.date(2026, 11, 23)
        ts_emp = Timesheet.objects.create(
            employee=emp,
            week_start_date=monday,
            status=TimesheetWeekStatus.SUBMITTED,
        )
        ts_admin = Timesheet.objects.create(
            employee=admin1,
            week_start_date=monday,
            status=TimesheetWeekStatus.SUBMITTED,
        )

        emp_client = APIClient()
        emp_client.force_login(emp)

        res_emp_approve = emp_client.post(f"/api/timesheets/{ts_emp.id}/approve/", {})
        assert res_emp_approve.status_code == 403

        res_emp_return = emp_client.post(
            f"/api/timesheets/{ts_emp.id}/return/", {"reason": "Reason"}
        )
        assert res_emp_return.status_code == 403

        admin_client = APIClient()
        admin_client.force_login(admin1)

        res_self_approve = admin_client.post(f"/api/timesheets/{ts_admin.id}/approve/", {})
        assert res_self_approve.status_code == 400
        assert "own" in str(res_self_approve.json()).lower()

        res_self_return = admin_client.post(
            f"/api/timesheets/{ts_admin.id}/return/", {"reason": "Self return"}
        )
        assert res_self_return.status_code == 400
        assert "own" in str(res_self_return.json()).lower()

        res_return_blank = admin_client.post(
            f"/api/timesheets/{ts_emp.id}/return/", {"reason": "   "}
        )
        assert res_return_blank.status_code == 400

        res_return = admin_client.post(
            f"/api/timesheets/{ts_emp.id}/return/", {"reason": "Missing hours for Wednesday"}
        )
        assert res_return.status_code == 200
        assert res_return.json()["status"] == "RETURNED"
        assert res_return.json()["return_reason"] == "Missing hours for Wednesday"
        ts_emp.refresh_from_db()
        assert ts_emp.status == TimesheetWeekStatus.RETURNED
        assert ts_emp.returned_by == admin1
        assert ts_emp.returned_at is not None
        assert AuditLog.objects.filter(action="TIMESHEET_RETURN", entity_id=str(ts_emp.id)).exists()

        res_approve_returned = admin_client.post(f"/api/timesheets/{ts_emp.id}/approve/", {})
        assert res_approve_returned.status_code == 400

        ts_emp.status = TimesheetWeekStatus.SUBMITTED
        ts_emp.save()

        res_approve = admin_client.post(f"/api/timesheets/{ts_emp.id}/approve/", {})
        assert res_approve.status_code == 200
        assert res_approve.json()["status"] == "APPROVED"
        ts_emp.refresh_from_db()
        assert ts_emp.status == TimesheetWeekStatus.APPROVED
        assert ts_emp.approved_by == admin1
        assert ts_emp.approved_at is not None
        assert AuditLog.objects.filter(
            action="TIMESHEET_APPROVE", entity_id=str(ts_emp.id)
        ).exists()

        super_client = APIClient()
        session = super_client.session
        session["is_super_admin"] = True
        session["super_admin_username"] = "superadmin"
        session.save()

        res_super_approve = super_client.post(f"/api/timesheets/{ts_admin.id}/approve/", {})
        assert res_super_approve.status_code == 200
        assert res_super_approve.json()["status"] == "APPROVED"
        ts_admin.refresh_from_db()
        assert ts_admin.status == TimesheetWeekStatus.APPROVED
        assert ts_admin.approved_by_label == "SUPER:superadmin"
