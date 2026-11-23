import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.audit.models import AuditLog
from apps.projects.models import ProjectStep, StepStatus
from apps.projects.services import create_project, insert_sub_step

@pytest.mark.django_db
def test_manage_custom_sub_steps():
    admin = User.objects.create_user(
        employee_code="SYS-0001",
        email="admin@example.com",
        full_name="Admin User",
        role=UserRole.ADMIN,
        password="ValidPassword123!",
    )
    employee = User.objects.create_user(
        employee_code="SYS-0002",
        email="employee@example.com",
        full_name="Employee User",
        role=UserRole.EMPLOYEE,
        password="ValidPassword123!",
    )

    project = create_project(
        name="Turbine Installation",
        creator=admin,
    )

    step_1 = project.steps.get(position=1)
    custom_step = insert_sub_step(
        project_id=project.id,
        after_step_id=step_1.id,
        name="Initial Inspection",
        actor=admin,
    )
    assert custom_step.position == 2
    step_3 = project.steps.get(position=3)

    client = APIClient()
    client.force_login(employee)
    res_emp = client.patch(
        f"/api/projects/{project.id}/steps/{custom_step.id}/",
        {"name": "Hacked Name"},
        format="json",
    )
    assert res_emp.status_code == 403

    client.force_login(admin)

    res_core_edit = client.patch(
        f"/api/projects/{project.id}/steps/{step_1.id}/",
        {"name": "Renamed Enquiry"},
        format="json",
    )
    assert res_core_edit.status_code == 400
    assert "custom" in str(res_core_edit.json()).lower()

    res_edit = client.patch(
        f"/api/projects/{project.id}/steps/{custom_step.id}/",
        {"name": "Initial Site Inspection"},
        format="json",
    )
    assert res_edit.status_code == 200
    assert res_edit.json()["name"] == "Initial Site Inspection"
    assert AuditLog.objects.filter(action="SUB_STEP_UPDATE", entity_id=str(custom_step.id)).exists()

    custom_step.status = StepStatus.IN_PROGRESS
    custom_step.save()

    res_started_edit = client.patch(
        f"/api/projects/{project.id}/steps/{custom_step.id}/",
        {"name": "Another Name"},
        format="json",
    )
    assert res_started_edit.status_code == 400
    assert "NOT_STARTED" in str(res_started_edit.json())

    res_started_delete = client.delete(
        f"/api/projects/{project.id}/steps/{custom_step.id}/",
    )
    assert res_started_delete.status_code == 400
    assert "NOT_STARTED" in str(res_started_delete.json())

    custom_step.status = StepStatus.NOT_STARTED
    custom_step.save()

    res_core_delete = client.delete(
        f"/api/projects/{project.id}/steps/{step_1.id}/",
    )
    assert res_core_delete.status_code == 400
    assert "custom" in str(res_core_delete.json()).lower()

    res_del = client.delete(
        f"/api/projects/{project.id}/steps/{custom_step.id}/",
    )
    assert res_del.status_code == 204
    assert not ProjectStep.objects.filter(id=custom_step.id).exists()
    assert AuditLog.objects.filter(action="SUB_STEP_DELETE", entity_id=str(custom_step.id)).exists()

    step_3.refresh_from_db()
    assert step_3.position == 2
