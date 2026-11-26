import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.audit.models import ActorKind, AuditLog
from apps.telemetry.models import RequestLog


@pytest.mark.django_db
def test_audit_log_append_only_guarantee():
    log = AuditLog.objects.create(
        actor_kind=ActorKind.EMPLOYEE,
        actor_label="SYS-0010",
        action="TIMESHEET_SAVE",
        entity_type="Timesheet",
        entity_id="1",
        summary="Saved Monday hours",
    )
    with pytest.raises(RuntimeError, match="append-only"):
        log.summary = "Hacked summary"
        log.save()

    with pytest.raises(RuntimeError, match="cannot be individually deleted"):
        log.delete()


@pytest.mark.django_db
def test_audit_telemetry_full_roundtrip():
    user = User.objects.create_user(
        email="telemetry.user@example.com",
        employee_code="SYS-0888",
        full_name="Telemetry User",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    client = APIClient(HTTP_USER_AGENT="SysTrolTestAgent/1.0", REMOTE_ADDR="192.168.10.50")

    login_resp = client.post(
        reverse("auth_login"),
        {"identifier": "SYS-0888", "password": "ValidPassword123!"},
        format="json",
    )
    assert login_resp.status_code == 200

    login_audit = AuditLog.objects.filter(action="LOGIN_SUCCESS").first()
    assert login_audit is not None
    assert login_audit.actor_user == user
    assert login_audit.user_agent == "SysTrolTestAgent/1.0"
    assert login_audit.ip_address == "192.168.10.50"

    login_req = RequestLog.objects.filter(path__contains="/api/auth/login").first()
    assert login_req is not None
    assert login_req.method == "POST"
    assert login_req.status_code == 200
    assert login_req.ip_address == "192.168.10.50"
    assert login_req.duration_ms >= 0
