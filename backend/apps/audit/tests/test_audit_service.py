import pytest
from django.test import RequestFactory
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit import services
from apps.audit.models import ActorKind, AuditLog

@pytest.mark.django_db
def test_request_id_middleware_header():
    client = APIClient()
    response = client.get(reverse("health_check"))
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert len(response.headers["X-Request-ID"]) > 10

@pytest.mark.django_db
def test_record_audit_with_user():
    user = User.objects.create_user(
        email="auditor@example.com",
        employee_code="SYS-0005",
        full_name="Auditor",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    factory = RequestFactory()
    request = factory.post("/api/projects/", HTTP_X_REQUEST_ID="req-test-123", REMOTE_ADDR="10.1.2.3")
    request.request_id = "req-test-123"
    request.user = user

    log = services.record(
        action="PROJECT_CREATE",
        actor=user,
        entity_type="Project",
        entity_id="101",
        summary="Created project Alpha",
        changes={"name": [None, "Alpha"]},
        request=request,
    )

    assert log.actor_kind == ActorKind.ADMIN
    assert log.actor_user == user
    assert log.actor_label == "SYS-0005"
    assert log.action == "PROJECT_CREATE"
    assert log.ip_address == "10.1.2.3"
    assert log.request_id == "req-test-123"
    assert log.super_only is False

@pytest.mark.django_db
def test_record_audit_with_super_admin():
    principal = SuperAdminPrincipal("superadmin")
    log = services.record(
        action="SYSTEM_RECONFIGURE",
        actor=principal,
        entity_type="Config",
        entity_id="policy",
        summary="Updated standard hours",
    )
    assert log.actor_kind == ActorKind.SUPER
    assert log.actor_label == "SUPER:superadmin"
    assert log.super_only is True
