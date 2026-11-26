import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.accounts.principals import SuperAdminPrincipal
from apps.accounts.services import is_login_locked, record_login_attempt
from apps.audit.models import AuditLog


@pytest.mark.django_db
def test_super_admin_recovery_endpoints():
    admin = User.objects.create_user(
        email="admin.recov@example.com",
        employee_code="SYS-0250",
        full_name="Admin Recovery",
        password="OldPassword123!",
        role=UserRole.ADMIN,
        is_active=False,
    )
    admin_client = APIClient()
    admin_client.force_authenticate(user=admin)

    forbidden_resp = admin_client.post(
        reverse("super_reset_admin_password"),
        {"employee_id": admin.id},
        format="json",
    )
    assert forbidden_resp.status_code == 403

    super_client = APIClient()
    super_principal = SuperAdminPrincipal("superadmin")
    super_client.force_authenticate(user=super_principal)

    reset_resp = super_client.post(
        reverse("super_reset_admin_password"),
        {"employee_id": admin.id},
        format="json",
    )
    assert reset_resp.status_code == 200
    assert "temporary_password" in reset_resp.data
    temp_pwd = reset_resp.data["temporary_password"]

    admin.refresh_from_db()
    assert admin.check_password(temp_pwd) is True
    assert admin.must_change_password is True

    audit_reset = AuditLog.objects.filter(action="SUPER_ADMIN_PASSWORD_RESET").first()
    assert audit_reset is not None
    assert audit_reset.super_only is True

    restore_resp = super_client.post(
        reverse("super_restore_account"),
        {"employee_id": admin.id, "reason": "Restored by super admin recovery"},
        format="json",
    )
    assert restore_resp.status_code == 200
    admin.refresh_from_db()
    assert admin.is_active is True

    for _ in range(5):
        record_login_attempt("locked@example.com", "10.0.0.99", successful=False)
    assert is_login_locked("locked@example.com", "10.0.0.99") is True

    clear_resp = super_client.post(
        reverse("super_clear_lockout"),
        {"identifier": "locked@example.com", "ip_address": "10.0.0.99"},
        format="json",
    )
    assert clear_resp.status_code == 200
    assert is_login_locked("locked@example.com", "10.0.0.99") is False
