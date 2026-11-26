import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.projects.services import create_project


@pytest.mark.django_db
def test_project_detail_view():
    admin = User.objects.create_user(
        email="padmin.det@example.com",
        employee_code="SYS-0410",
        full_name="Admin Det",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    emp = User.objects.create_user(
        email="pemp.det@example.com",
        employee_code="SYS-0411",
        full_name="Emp Det",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )
    project = create_project(
        name="Turbine Overhaul",
        creator=admin,
        client_name="NTPC",
        description="Power plant turbine refurbishment",
        member_ids=[emp.id],
    )

    client = APIClient()
    client.force_authenticate(user=emp)

    resp = client.get(reverse("project_detail", kwargs={"pk": project.id}))
    assert resp.status_code == 200
    assert resp.data["code"] == project.code
    assert resp.data["name"] == "Turbine Overhaul"
    assert resp.data["creator"]["employee_code"] == "SYS-0410"
    assert len(resp.data["steps"]) == 14
    assert resp.data["steps"][0]["key"] == "ENQUIRY"
    assert resp.data["steps"][0]["position"] == 1
    assert resp.data["steps"][-1]["key"] == "AMC"
    assert resp.data["steps"][-1]["position"] == 14
    assert len(resp.data["members"]) == 1
    assert resp.data["members"][0]["employee_code"] == "SYS-0411"

    project.is_active = False
    project.save()

    emp_blocked = client.get(reverse("project_detail", kwargs={"pk": project.id}))
    assert emp_blocked.status_code == 403

    admin_client = APIClient()
    admin_client.force_authenticate(user=admin)
    admin_allowed = admin_client.get(reverse("project_detail", kwargs={"pk": project.id}))
    assert admin_allowed.status_code == 200
