import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole


@pytest.mark.django_db
def test_employee_list_permissions():
    admin = User.objects.create_user(
        email="admin.list@example.com",
        employee_code="SYS-0101",
        full_name="Admin List",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    emp = User.objects.create_user(
        email="emp.list@example.com",
        employee_code="SYS-0102",
        full_name="Emp List",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )

    emp_client = APIClient()
    emp_client.force_authenticate(user=emp)
    emp_resp = emp_client.get(reverse("employee_list_create"))
    assert emp_resp.status_code == 403

    admin_client = APIClient()
    admin_client.force_authenticate(user=admin)
    admin_resp = admin_client.get(reverse("employee_list_create"))
    assert admin_resp.status_code == 200
    assert admin_resp.data["count"] == 2


@pytest.mark.django_db
def test_employee_list_filtering_and_search():
    admin = User.objects.create_user(
        email="lead@company.com",
        employee_code="SYS-0110",
        full_name="Lead Admin",
        designation="Engineering Lead",
        department="Engineering",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    User.objects.create_user(
        email="worker@company.com",
        employee_code="SYS-0111",
        full_name="Factory Worker",
        designation="Fabricator",
        department="Manufacturing",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    search_resp = client.get(f"{reverse('employee_list_create')}?search=Worker")
    assert search_resp.status_code == 200
    assert search_resp.data["count"] == 1
    assert search_resp.data["results"][0]["employee_code"] == "SYS-0111"

    role_resp = client.get(f"{reverse('employee_list_create')}?role=ADMIN")
    assert role_resp.status_code == 200
    assert role_resp.data["count"] == 1
    assert role_resp.data["results"][0]["employee_code"] == "SYS-0110"


@pytest.mark.django_db
def test_employee_lookup_endpoint():
    admin = User.objects.create_user(
        email="lookup.admin@company.com",
        employee_code="SYS-0201",
        full_name="Lookup Admin",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    emp1 = User.objects.create_user(
        email="john.doe@company.com",
        employee_code="SYS-0202",
        full_name="John Doe",
        designation="Engineer",
        department="Engineering",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )
    emp2 = User.objects.create_user(
        email="jane.smith@company.com",
        employee_code="SYS-0203",
        full_name="Jane Smith",
        designation="Designer",
        department="R&D",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )
    revoked = User.objects.create_user(
        email="revoked@company.com",
        employee_code="SYS-0204",
        full_name="Revoked User",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
        is_active=False,
    )

    client = APIClient()
    client.force_authenticate(user=emp1)

    resp = client.get(reverse("employee_lookup"))
    assert resp.status_code == 200
    codes = [item["employee_code"] for item in resp.data]
    assert "SYS-0201" in codes
    assert "SYS-0202" in codes
    assert "SYS-0203" in codes
    assert "SYS-0204" not in codes

    search_resp = client.get(f"{reverse('employee_lookup')}?search=Jane")
    assert search_resp.status_code == 200
    assert len(search_resp.data) == 1
    assert search_resp.data[0]["employee_code"] == "SYS-0203"
