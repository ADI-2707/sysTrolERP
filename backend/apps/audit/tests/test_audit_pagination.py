import pytest
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from apps.accounts.models import User, UserRole
from apps.audit import services as audit_services
from apps.audit.models import AuditLog
from apps.audit.pagination import AuditCursorPagination


@pytest.mark.django_db
def test_audit_cursor_pagination():
    admin = User.objects.create_user(
        employee_code="SYS-0001",
        email="admin@example.com",
        full_name="Admin One",
        role=UserRole.ADMIN,
        password="ValidPassword123!",
    )

    for i in range(60):
        audit_services.record(
            action=f"ACTION_{i}",
            actor=admin,
            entity_type="Item",
            entity_id=str(i),
            summary=f"Event {i}",
        )

    qs = AuditLog.objects.all().order_by("-id")
    factory = APIRequestFactory()
    wsgi_req1 = factory.get("/api/audit/logs/?page_size=25")
    drf_req1 = Request(wsgi_req1)

    paginator = AuditCursorPagination()
    page1 = paginator.paginate_queryset(qs, drf_req1)
    assert len(page1) == 25
    assert page1[0].id > page1[1].id

    resp1 = paginator.get_paginated_response(page1).data
    assert resp1["next"] is not None
    assert resp1["previous"] is None

    next_url = resp1["next"]
    wsgi_req2 = factory.get(next_url)
    drf_req2 = Request(wsgi_req2)
    page2 = paginator.paginate_queryset(qs, drf_req2)
    assert len(page2) == 25

    ids1 = {log.id for log in page1}
    ids2 = {log.id for log in page2}
    assert len(ids1.intersection(ids2)) == 0
