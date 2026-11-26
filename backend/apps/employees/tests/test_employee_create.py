import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.accounts.principals import SuperAdminPrincipal


@pytest.mark.django_db
def test_admin_create_employee_success():
    admin = User.objects.create_user(
        email="admin.creator@example.com",
        employee_code="SYS-0200",
        full_name="Admin Creator",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    payload = {
        "email": "new.hire@example.com",
        "full_name": "New Hire",
        "phone": "+919876543210",
        "designation": "Associate Engineer",
        "department": "Engineering",
        "role": "EMPLOYEE",
    }
    response = client.post(reverse("employee_list_create"), payload, format="json")
    assert response.status_code == 201
    assert response.data["email"] == "new.hire@example.com"
    assert response.data["employee_code"].startswith("SYS-")
    assert "temporary_password" in response.data
    assert len(response.data["temporary_password"]) >= 10
    assert response.data["must_change_password"] is True


@pytest.mark.django_db
def test_admin_cannot_create_admin():
    admin = User.objects.create_user(
        email="admin.restricted@example.com",
        employee_code="SYS-0201",
        full_name="Admin Restricted",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    payload = {
        "email": "another.admin@example.com",
        "full_name": "Another Admin",
        "role": "ADMIN",
    }
    response = client.post(reverse("employee_list_create"), payload, format="json")
    assert response.status_code == 403
    assert "Only super admin can create administrators" in response.data["message"]


@pytest.mark.django_db
def test_super_admin_can_create_admin():
    super_admin = SuperAdminPrincipal("superadmin")
    client = APIClient()
    client.force_authenticate(user=super_admin)

    payload = {
        "email": "approved.admin@example.com",
        "full_name": "Approved Admin",
        "role": "ADMIN",
    }
    response = client.post(reverse("employee_list_create"), payload, format="json")
    assert response.status_code == 201
    assert response.data["role"] == "ADMIN"
    assert "temporary_password" in response.data


@pytest.mark.django_db
def test_create_employee_duplicate_email():
    User.objects.create_user(
        email="existing@example.com",
        employee_code="SYS-0202",
        full_name="Existing User",
        password="ValidPassword123!",
    )
    admin = User.objects.create_user(
        email="admin2@example.com",
        employee_code="SYS-0203",
        full_name="Admin 2",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    payload = {
        "email": "existing@example.com",
        "full_name": "Duplicate User",
        "role": "EMPLOYEE",
    }
    response = client.post(reverse("employee_list_create"), payload, format="json")
    assert response.status_code == 400
    assert "email" in response.data["fields"]
