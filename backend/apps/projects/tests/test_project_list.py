import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.projects.services import create_project


@pytest.mark.django_db
def test_project_list_view_permissions_and_filtering():
    admin = User.objects.create_user(
        email="padmin@example.com",
        employee_code="SYS-0401",
        full_name="Project Admin",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    emp = User.objects.create_user(
        email="pemp@example.com",
        employee_code="SYS-0402",
        full_name="Project Emp",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )

    proj1 = create_project(
        name="Active Blast Furnace",
        creator=admin,
        client_name="Client A",
    )
    proj2 = create_project(
        name="Completed Rolling Mill",
        creator=admin,
        client_name="Client B",
    )
    proj2.is_active = False
    proj2.save()

    emp_client = APIClient()
    emp_client.force_authenticate(user=emp)
    emp_resp = emp_client.get(reverse("project_list_create"))
    assert emp_resp.status_code == 200
    assert emp_resp.data["count"] == 1
    assert emp_resp.data["results"][0]["code"] == proj1.code

    admin_client = APIClient()
    admin_client.force_authenticate(user=admin)
    admin_resp = admin_client.get(reverse("project_list_create"))
    assert admin_resp.status_code == 200
    assert admin_resp.data["count"] == 2

    search_resp = admin_client.get(f"{reverse('project_list_create')}?search=Rolling")
    assert search_resp.status_code == 200
    assert search_resp.data["count"] == 1
    assert search_resp.data["results"][0]["code"] == proj2.code

    create_payload = {
        "name": "New Project Via API",
        "client_name": "API Client",
    }
    create_resp = admin_client.post(reverse("project_list_create"), create_payload, format="json")
    assert create_resp.status_code == 201
    assert create_resp.data["total_steps"] == 14
    assert create_resp.data["completion_percentage"] == 0.0
    assert create_resp.data["current_step"]["key"] == "ENQUIRY"

    emp_create = emp_client.post(reverse("project_list_create"), create_payload, format="json")
    assert emp_create.status_code == 403
