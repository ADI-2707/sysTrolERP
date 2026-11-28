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
        "employee_code": "0001",
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
    assert len(response.data["employee_code"]) == 4
    assert response.data["employee_code"].isdigit()
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
        "employee_code": "0002",
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
        "employee_code": "0003",
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
        "employee_code": "0004",
        "email": "existing@example.com",
        "full_name": "Duplicate User",
        "role": "EMPLOYEE",
    }
    response = client.post(reverse("employee_list_create"), payload, format="json")
    assert response.status_code == 400
    assert "email" in response.data["fields"]


@pytest.mark.django_db
def test_admin_create_employee_with_custom_code():
    admin = User.objects.create_user(
        email="admin.custom@example.com",
        employee_code="0010",
        full_name="Admin Custom",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    payload = {
        "employee_code": "0042",
        "full_name": "Custom Code Hire",
        "role": "EMPLOYEE",
    }
    response = client.post(reverse("employee_list_create"), payload, format="json")
    assert response.status_code == 201
    assert response.data["employee_code"] == "0042"


@pytest.mark.django_db
def test_create_employee_code_validation():
    admin = User.objects.create_user(
        email="admin.val@example.com",
        employee_code="0011",
        full_name="Admin Val",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    res_alpha = client.post(
        reverse("employee_list_create"),
        {"employee_code": "ABCD", "full_name": "Alpha Code"},
        format="json",
    )
    assert res_alpha.status_code == 400

    res_length = client.post(
        reverse("employee_list_create"),
        {"employee_code": "123", "full_name": "Short Code"},
        format="json",
    )
    assert res_length.status_code == 400

    res_super = client.post(
        reverse("employee_list_create"),
        {"employee_code": "9999", "full_name": "Reserved Code"},
        format="json",
    )
    assert res_super.status_code == 400

    res_dup = client.post(
        reverse("employee_list_create"),
        {"employee_code": "0011", "full_name": "Duplicate Code"},
        format="json",
    )
    assert res_dup.status_code == 400

    res_missing = client.post(
        reverse("employee_list_create"),
        {"full_name": "No Code"},
        format="json",
    )
    assert res_missing.status_code == 400
