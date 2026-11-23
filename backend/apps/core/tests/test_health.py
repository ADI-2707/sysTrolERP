import pytest
from django.urls import reverse
from rest_framework.test import APIClient

@pytest.mark.django_db
def test_health_check_healthy():
    client = APIClient()
    response = client.get(reverse("health_check"))
    assert response.status_code == 200
    assert response.data["status"] == "healthy"
    assert response.data["database"] == "connected"
    assert "timestamp" in response.data

@pytest.mark.django_db
def test_openapi_schema_endpoint():
    client = APIClient()
    response = client.get(reverse("schema"))
    assert response.status_code == 200
    assert "openapi" in response.data or "info" in response.data
