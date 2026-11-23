import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.telemetry.models import RequestLog

@pytest.mark.django_db
def test_request_logging_middleware_logs_api():
    client = APIClient()
    initial_count = RequestLog.objects.count()

    response = client.get(reverse("schema"))
    assert response.status_code == 200

    new_count = RequestLog.objects.count()
    assert new_count == initial_count + 1

    log = RequestLog.objects.first()
    assert log.method == "GET"
    assert "/api/schema/" in log.path
    assert log.status_code == 200
    assert log.duration_ms >= 0

@pytest.mark.django_db
def test_request_logging_middleware_excludes_health():
    client = APIClient()
    initial_count = RequestLog.objects.count()

    response = client.get(reverse("health_check"))
    assert response.status_code == 200

    new_count = RequestLog.objects.count()
    assert new_count == initial_count
