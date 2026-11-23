import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit import services as audit_services

@pytest.mark.django_db
def test_audit_log_list_endpoint():
    admin = User.objects.create_user(
        employee_code="SYS-0001",
        email="admin@example.com",
        full_name="Admin One",
        role=UserRole.ADMIN,
        password="ValidPassword123!",
    )
    emp = User.objects.create_user(
        employee_code="SYS-0002",
        email="emp@example.com",
        full_name="Employee Two",
        role=UserRole.EMPLOYEE,
        password="ValidPassword123!",
    )
    super_admin = SuperAdminPrincipal()

    audit_services.record(
        action="EMP_UPDATE",
        actor=admin,
        entity_type="User",
        entity_id=str(emp.id),
        summary="Updated employee profile",
    )
    audit_services.record(
        action="SUPER_CREDENTIALS_RECOVERY",
        actor=super_admin,
        entity_type="AdminRecovery",
        entity_id="SYS-0001",
        summary="Super admin issued recovery token",
        super_only=True,
    )

    emp_client = APIClient()
    emp_client.force_login(emp)
    res_emp = emp_client.get("/api/audit/logs/")
    assert res_emp.status_code == 403

    admin_client = APIClient()
    admin_client.force_login(admin)
    res_admin = admin_client.get("/api/audit/logs/")
    assert res_admin.status_code == 200
    admin_results = res_admin.json()["results"]
    assert len(admin_results) == 1
    assert admin_results[0]["action"] == "EMP_UPDATE"
    assert admin_results[0]["super_only"] is False

    super_client = APIClient()
    session = super_client.session
    session["is_super_admin"] = True
    session["super_admin_username"] = "superadmin"
    session.save()

    res_super = super_client.get("/api/audit/logs/")
    assert res_super.status_code == 200
    super_results = res_super.json()["results"]
    assert len(super_results) == 2
    actions = {r["action"] for r in super_results}
    assert "EMP_UPDATE" in actions
    assert "SUPER_CREDENTIALS_RECOVERY" in actions
