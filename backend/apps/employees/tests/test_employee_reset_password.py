import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit.models import AuditLog

@pytest.mark.django_db
def test_admin_reset_employee_password():
    admin = User.objects.create_user(
        email="admin.reset@example.com",
        employee_code="SYS-0240",
        full_name="Admin Reset",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    emp = User.objects.create_user(
        email="emp.reset@example.com",
        employee_code="SYS-0241",
        full_name="Emp Reset",
        password="OldPassword123!",
        role=UserRole.EMPLOYEE,
        must_change_password=False,
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    resp = client.post(reverse("employee_reset_password", kwargs={"pk": emp.id}), format="json")
    assert resp.status_code == 200
    assert "temporary_password" in resp.data
    temp_pwd = resp.data["temporary_password"]

    emp.refresh_from_db()
    assert emp.check_password(temp_pwd) is True
    assert emp.must_change_password is True

    audit = AuditLog.objects.filter(action="PASSWORD_RESET_BY_ADMIN", entity_id=str(emp.id)).first()
    assert audit is not None

@pytest.mark.django_db
def test_admin_cannot_reset_admin_password():
    admin1 = User.objects.create_user(
        email="admin.r1@example.com",
        employee_code="SYS-0242",
        full_name="Admin R1",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    admin2 = User.objects.create_user(
        email="admin.r2@example.com",
        employee_code="SYS-0243",
        full_name="Admin R2",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    client = APIClient()
    client.force_authenticate(user=admin1)

    resp = client.post(reverse("employee_reset_password", kwargs={"pk": admin2.id}), format="json")
    assert resp.status_code == 403
    assert "Only the super administrator can reset an admin's password" in resp.data["message"]

@pytest.mark.django_db
def test_super_admin_can_reset_admin_password():
    admin = User.objects.create_user(
        email="admin.r3@example.com",
        employee_code="SYS-0244",
        full_name="Admin R3",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    client = APIClient()
    client.force_authenticate(user=SuperAdminPrincipal("superadmin"))

    resp = client.post(reverse("employee_reset_password", kwargs={"pk": admin.id}), format="json")
    assert resp.status_code == 200
    assert "temporary_password" in resp.data
