import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit.models import AuditLog

@pytest.mark.django_db
def test_admin_revoke_and_restore_employee():
    admin = User.objects.create_user(
        email="admin.rr@example.com",
        employee_code="SYS-0230",
        full_name="Admin RR",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    emp = User.objects.create_user(
        email="emp.rr@example.com",
        employee_code="SYS-0231",
        full_name="Emp RR",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    no_reason = client.post(reverse("employee_revoke", kwargs={"pk": emp.id}), {}, format="json")
    assert no_reason.status_code == 400
    assert "reason" in no_reason.data["fields"]

    resp = client.post(
        reverse("employee_revoke", kwargs={"pk": emp.id}),
        {"reason": "Contract ended."},
        format="json",
    )
    assert resp.status_code == 200
    emp.refresh_from_db()
    assert emp.is_active is False
    assert emp.revoked_at is not None
    assert emp.revoked_by == admin

    revoke_log = AuditLog.objects.filter(action="EMPLOYEE_REVOKE", entity_id=str(emp.id)).first()
    assert revoke_log is not None
    assert "Contract ended" in revoke_log.summary

    restore_resp = client.post(
        reverse("employee_restore", kwargs={"pk": emp.id}),
        {"reason": "Rehired."},
        format="json",
    )
    assert restore_resp.status_code == 200
    emp.refresh_from_db()
    assert emp.is_active is True
    assert emp.revoked_at is None
    assert emp.revoked_by is None

@pytest.mark.django_db
def test_admin_self_revoke_blocked():
    admin = User.objects.create_user(
        email="admin.self@example.com",
        employee_code="SYS-0232",
        full_name="Admin Self",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    resp = client.post(
        reverse("employee_revoke", kwargs={"pk": admin.id}),
        {"reason": "Self leave"},
        format="json",
    )
    assert resp.status_code == 403
    assert "Self-revocation is not allowed" in resp.data["message"]

@pytest.mark.django_db
def test_admin_cannot_revoke_admin_only_super_can():
    admin1 = User.objects.create_user(
        email="admin.first@example.com",
        employee_code="SYS-0233",
        full_name="Admin One",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    admin2 = User.objects.create_user(
        email="admin.second@example.com",
        employee_code="SYS-0234",
        full_name="Admin Two",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    admin_client = APIClient()
    admin_client.force_authenticate(user=admin1)

    fail_resp = admin_client.post(
        reverse("employee_revoke", kwargs={"pk": admin2.id}),
        {"reason": "Attempted admin revoking admin"},
        format="json",
    )
    assert fail_resp.status_code == 403
    assert "Only the super administrator can revoke an admin" in fail_resp.data["message"]

    super_client = APIClient()
    super_admin = SuperAdminPrincipal("superadmin")
    super_client.force_authenticate(user=super_admin)

    success_resp = super_client.post(
        reverse("employee_revoke", kwargs={"pk": admin2.id}),
        {"reason": "Super admin decision"},
        format="json",
    )
    assert success_resp.status_code == 200
    admin2.refresh_from_db()
    assert admin2.is_active is False
