import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.audit import services as audit_services


@pytest.mark.django_db
def test_employee_detail_success():
    admin = User.objects.create_user(
        email="admin.det@example.com",
        employee_code="SYS-0210",
        full_name="Admin Det",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    target = User.objects.create_user(
        email="target.det@example.com",
        employee_code="SYS-0211",
        full_name="Target Det",
        designation="Quality Specialist",
        department="Operations",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )
    audit_services.record(
        action="LOGIN_SUCCESS",
        actor=target,
        entity_type="User",
        entity_id=str(target.id),
        summary="Target logged in",
    )

    client = APIClient()
    client.force_authenticate(user=admin)

    response = client.get(reverse("employee_detail", kwargs={"pk": target.id}))
    assert response.status_code == 200
    assert response.data["id"] == target.id
    assert response.data["email"] == "target.det@example.com"
    assert response.data["designation"] == "Quality Specialist"
    assert "assigned_projects" in response.data
    assert len(response.data["recent_activity"]) >= 1


@pytest.mark.django_db
def test_employee_detail_not_found():
    admin = User.objects.create_user(
        email="admin.nf@example.com",
        employee_code="SYS-0212",
        full_name="Admin NF",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    response = client.get(reverse("employee_detail", kwargs={"pk": 999999}))
    assert response.status_code == 404
    assert response.data["code"] == "not_found"
