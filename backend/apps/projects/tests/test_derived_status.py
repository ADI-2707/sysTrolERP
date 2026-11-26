import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.projects.models import StepStatus
from apps.projects.services import create_project, insert_sub_step


@pytest.mark.django_db
def test_derived_project_status_and_completion():
    admin = User.objects.create_user(
        employee_code="SYS-0001",
        email="admin@example.com",
        full_name="Admin User",
        role=UserRole.ADMIN,
        password="ValidPassword123!",
    )

    project = create_project(
        name="Automation Plant",
        creator=admin,
    )

    client = APIClient()
    client.force_login(admin)

    res_init = client.get(f"/api/projects/{project.id}/")
    assert res_init.status_code == 200
    assert res_init.json()["status"] == "ACTIVE"
    assert res_init.json()["completion_percentage"] == 0.0
    assert res_init.json()["completed_steps"] == 0
    assert res_init.json()["total_steps"] == 14

    for step in project.steps.exclude(key="AMC"):
        step.status = StepStatus.COMPLETED
        step.save()

    res_partial = client.get(f"/api/projects/{project.id}/")
    assert res_partial.status_code == 200
    assert res_partial.json()["status"] == "ACTIVE"
    assert res_partial.json()["completed_steps"] == 13
    assert res_partial.json()["total_steps"] == 14

    sub_step = insert_sub_step(
        project_id=project.id,
        after_step_id=project.steps.get(key="PAYMENT").id,
        name="Extra Signoff",
        actor=admin,
    )

    res_after_sub = client.get(f"/api/projects/{project.id}/")
    assert res_after_sub.status_code == 200
    assert res_after_sub.json()["status"] == "ACTIVE"
    assert res_after_sub.json()["total_steps"] == 15
    assert res_after_sub.json()["completed_steps"] == 13

    for step in project.steps.all():
        step.status = StepStatus.COMPLETED
        step.save()

    res_all_done = client.get(f"/api/projects/{project.id}/")
    assert res_all_done.status_code == 200
    assert res_all_done.json()["status"] == "COMPLETED"
    assert res_all_done.json()["completion_percentage"] == 100.0
