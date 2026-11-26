import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.audit.models import AuditLog


@pytest.mark.django_db
def test_auth_audit_events_recorded():
    user = User.objects.create_user(
        email="auditauth@example.com",
        employee_code="SYS-0300",
        full_name="Audit Auth User",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )
    client = APIClient(REMOTE_ADDR="192.168.1.55")

    client.post(
        reverse("auth_login"),
        {"identifier": "auditauth@example.com", "password": "WrongPassword!"},
        format="json",
    )
    fail_log = AuditLog.objects.filter(action="LOGIN_FAILURE").first()
    assert fail_log is not None
    assert fail_log.entity_id == "auditauth@example.com"
    assert fail_log.ip_address == "192.168.1.55"

    login_resp = client.post(
        reverse("auth_login"),
        {"identifier": "auditauth@example.com", "password": "ValidPassword123!"},
        format="json",
    )
    assert login_resp.status_code == 200
    success_log = AuditLog.objects.filter(action="LOGIN_SUCCESS").first()
    assert success_log is not None
    assert success_log.actor_user == user

    client.post(
        reverse("auth_password_change"),
        {
            "current_password": "ValidPassword123!",
            "new_password": "NewSecretPassword123!",
            "confirm_password": "NewSecretPassword123!",
        },
        format="json",
    )
    pwd_log = AuditLog.objects.filter(action="PASSWORD_CHANGE").first()
    assert pwd_log is not None
    assert pwd_log.actor_user == user

    client.post(reverse("auth_logout"))
    logout_log = AuditLog.objects.filter(action="LOGOUT").first()
    assert logout_log is not None
    assert logout_log.actor_user == user
