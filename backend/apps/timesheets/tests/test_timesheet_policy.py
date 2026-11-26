import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.audit.models import AuditLog
from apps.timesheets.models import TimesheetPolicy

@pytest.mark.django_db
def test_timesheet_policy_defaults_and_permissions():
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

    policy = TimesheetPolicy.get_current()
    assert str(policy.standard_start_time) == "09:00:00"
    assert str(policy.standard_end_time) == "18:00:00"
    assert float(policy.daily_regular_hours) == 8.00
    assert float(policy.break_duration_hours) == 1.00
    assert float(policy.hour_step) == 0.25

    client = APIClient()
    client.force_login(employee)

    # Regular employee cannot view timesheet policy (403 Forbidden)
    res_get_emp = client.get("/api/timesheets/policy/")
    assert res_get_emp.status_code == 403

    res_put_emp = client.put(
        "/api/timesheets/policy/",
        {"daily_regular_hours": "7.50"},
        format="json",
    )
    assert res_put_emp.status_code == 403

    # Admin cannot view or update timesheet policy (403 Forbidden)
    client.force_login(admin)
    res_get_admin = client.get("/api/timesheets/policy/")
    assert res_get_admin.status_code == 403

    res_put_admin = client.put(
        "/api/timesheets/policy/",
        {"daily_regular_hours": "7.50"},
        format="json",
    )
    assert res_put_admin.status_code == 403

    # Super admin can both view and update timesheet policy
    super_client = APIClient()
    session = super_client.session
    session["is_super_admin"] = True
    session["super_admin_username"] = "superadmin"
    session.save()

    res_get_super = super_client.get("/api/timesheets/policy/")
    assert res_get_super.status_code == 200
    assert float(res_get_super.json()["daily_regular_hours"]) == 8.00

    res_put_super = super_client.put(
        "/api/timesheets/policy/",
        {"daily_regular_hours": "7.50", "hour_step": "0.50"},
        format="json",
    )
    assert res_put_super.status_code == 200
    assert float(res_put_super.json()["daily_regular_hours"]) == 7.50
    assert float(res_put_super.json()["hour_step"]) == 0.50

    policy.refresh_from_db()
    assert float(policy.daily_regular_hours) == 7.50
    assert float(policy.hour_step) == 0.50

    assert AuditLog.objects.filter(action="TIMESHEET_POLICY_UPDATE").exists()

    res_invalid = super_client.put(
        "/api/timesheets/policy/",
        {"daily_regular_hours": "-5.00"},
        format="json",
    )
    assert res_invalid.status_code == 400
