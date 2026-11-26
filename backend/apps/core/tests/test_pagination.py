import pytest
from django.core.cache import cache
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from apps.accounts.models import User, UserRole
from apps.core.pagination import StandardPageNumberPagination


@pytest.mark.django_db
def test_standard_pagination_cached_count():
    cache.clear()
    User.objects.create_user(
        employee_code="SYS-0991",
        email="p1@example.com",
        full_name="P1 User",
        role=UserRole.EMPLOYEE,
        password="ValidPassword123!",
    )
    User.objects.create_user(
        employee_code="SYS-0992",
        email="p2@example.com",
        full_name="P2 User",
        role=UserRole.EMPLOYEE,
        password="ValidPassword123!",
    )

    paginator = StandardPageNumberPagination()
    factory = APIRequestFactory()

    req1 = Request(factory.get("/api/employees/?cached_count=true"))
    qs = User.objects.filter(employee_code__startswith="SYS-099").order_by("employee_code")
    page1 = paginator.paginate_queryset(qs, req1)
    resp1 = paginator.get_paginated_response([u.id for u in page1])

    assert resp1.data["count"] == 2
    assert resp1.data["total_pages"] == 1

    req2 = Request(factory.get("/api/employees/?cached_count=true"))
    page2 = paginator.paginate_queryset(qs, req2)
    resp2 = paginator.get_paginated_response([u.id for u in page2])
    assert resp2.data["count"] == 2
