import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit import services as audit_services
from apps.telemetry.models import ErrorLog, RequestLog


@pytest.mark.django_db
def test_audit_and_telemetry_permission_boundaries():
    admin = User.objects.create_user(
        employee_code="SYS-0001",
        email="admin@example.com",
        full_name="Admin One",
        role=UserRole.ADMIN,
        password="ValidPassword123!",
    )
    revoked_admin = User.objects.create_user(
        employee_code="SYS-0002",
        email="revoked@example.com",
        full_name="Revoked Admin",
        role=UserRole.ADMIN,
        is_active=False,
        password="ValidPassword123!",
    )
    emp = User.objects.create_user(
        employee_code="SYS-0003",
        email="emp@example.com",
        full_name="Employee Three",
        role=UserRole.EMPLOYEE,
        password="ValidPassword123!",
    )

    audit_services.record(action="TEST_ACTION_STD", actor=admin, summary="Standard action")
    audit_services.record(
        action="TEST_ACTION_SUPER",
        actor=SuperAdminPrincipal(),
        summary="Super action",
        super_only=True,
    )

    RequestLog.objects.create(
        method="GET",
        route_template="api/test/",
        path="/api/test/",
        status_code=200,
        duration_ms=10.0,
    )
    ErrorLog.objects.create(
        error_class="TestError",
        message="A test error",
    )

    endpoints = [
        "/api/audit/logs/",
        "/api/audit/logs/export/",
        "/api/telemetry/requests/",
        "/api/telemetry/errors/",
        "/api/telemetry/summary/",
    ]

    anon_client = APIClient()
    for ep in endpoints:
        res = anon_client.get(ep)
        assert res.status_code in (401, 403)

    emp_client = APIClient()
    emp_client.force_login(emp)
    for ep in endpoints:
        res = emp_client.get(ep)
        assert res.status_code == 403

    revoked_client = APIClient()
    revoked_client.force_login(revoked_admin)
    for ep in endpoints:
        res = revoked_client.get(ep)
        assert res.status_code in (401, 403)

    admin_client = APIClient()
    admin_client.force_login(admin)
    for ep in endpoints:
        res = admin_client.get(ep)
        assert res.status_code == 200

    admin_logs_res = admin_client.get("/api/audit/logs/")
    admin_actions = {r["action"] for r in admin_logs_res.json()["results"]}
    assert "TEST_ACTION_STD" in admin_actions
    assert "TEST_ACTION_SUPER" not in admin_actions

    super_client = APIClient()
    session = super_client.session
    session["is_super_admin"] = True
    session["super_admin_username"] = "superadmin"
    session.save()

    for ep in endpoints:
        res = super_client.get(ep)
        assert res.status_code == 200

    super_logs_res = super_client.get("/api/audit/logs/")
    super_actions = {r["action"] for r in super_logs_res.json()["results"]}
    assert "TEST_ACTION_STD" in super_actions
    assert "TEST_ACTION_SUPER" in super_actions
