import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit.models import AuditLog
from apps.projects.models import StepStatus
from apps.projects.services import create_project


@pytest.mark.django_db
def test_step_rules_and_boundaries():
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
        name="Turbine Project",
        creator=admin,
        member_ids=[employee.id],
    )

    client = APIClient()
    client.force_login(employee)

    res_emp_status = client.post(
        f"/api/projects/{project.id}/steps/{project.steps.first().id}/status/",
        {"status": "INITIATED"},
        format="json",
    )
    assert res_emp_status.status_code == 403

    res_emp_sub = client.post(
        f"/api/projects/{project.id}/sub-steps/",
        {"after_step_id": project.steps.first().id, "name": "Unauthorized Sub"},
        format="json",
    )
    assert res_emp_sub.status_code == 403

    client.force_login(admin)

    step_1 = project.steps.get(position=1)
    step_2 = project.steps.get(position=2)
    step_3 = project.steps.get(position=3)
    amc_step = project.steps.get(key="AMC")

    step_1.status = StepStatus.COMPLETED
    step_1.save(update_fields=["status"])
    step_2.status = StepStatus.IN_PROGRESS
    step_2.save(update_fields=["status"])

    res_nonexistent = client.post(
        f"/api/projects/{project.id}/sub-steps/",
        {"after_step_id": 99999, "name": "Invalid Target"},
        format="json",
    )
    assert res_nonexistent.status_code == 400

    res_amc = client.post(
        f"/api/projects/{project.id}/sub-steps/",
        {"after_step_id": amc_step.id, "name": "After AMC Sub"},
        format="json",
    )
    assert res_amc.status_code == 400
    assert "AMC" in str(res_amc.json())

    res_complete_without_confirm = client.post(
        f"/api/projects/{project.id}/steps/{step_3.id}/status/",
        {"status": "COMPLETED", "confirm": False},
        format="json",
    )
    assert res_complete_without_confirm.status_code == 400
    assert "confirm" in str(res_complete_without_confirm.json()).lower()

    res_complete_with_confirm = client.post(
        f"/api/projects/{project.id}/steps/{step_3.id}/status/",
        {"status": "COMPLETED", "confirm": True},
        format="json",
    )
    assert res_complete_with_confirm.status_code == 200
    step_3.refresh_from_db()
    assert step_3.status == StepStatus.COMPLETED
    assert step_3.confirmed_by == admin
    assert step_3.confirmed_at is not None

    res_backward = client.post(
        f"/api/projects/{project.id}/steps/{step_3.id}/status/",
        {"status": "IN_PROGRESS"},
        format="json",
    )
    assert res_backward.status_code == 400
    assert any(phrase in str(res_backward.json()).lower() for phrase in ["forward", "cannot be modified"])

    res_same = client.post(
        f"/api/projects/{project.id}/steps/{step_3.id}/status/",
        {"status": "COMPLETED", "confirm": True},
        format="json",
    )
    assert res_same.status_code == 400

    res_before_completed = client.post(
        f"/api/projects/{project.id}/sub-steps/",
        {"after_step_id": step_1.id, "name": "Before Completed Step"},
        format="json",
    )
    assert res_before_completed.status_code == 400
    assert "completed" in str(res_before_completed.json()).lower()

    res_at_completed = client.post(
        f"/api/projects/{project.id}/sub-steps/",
        {"after_step_id": step_3.id, "name": "After Completed Step 3"},
        format="json",
    )
    assert res_at_completed.status_code == 201
    new_sub = res_at_completed.json()
    assert new_sub["position"] == 4

    assert AuditLog.objects.filter(action="PROJECT_CREATE", entity_id=str(project.id)).exists()
    assert AuditLog.objects.filter(action="STEP_STATUS_CHANGE", entity_id=str(step_3.id)).exists()
    assert AuditLog.objects.filter(action="SUB_STEP_CREATE", entity_id=str(new_sub["id"])).exists()


@pytest.mark.django_db
def test_super_admin_step_and_substep_operations():
    super_admin = SuperAdminPrincipal()
    client = APIClient()
    session = client.session
    session["is_super_admin"] = True
    session["super_admin_username"] = "superadmin"
    session.save()

    project = create_project(
        name="Super Admin Power Grid",
        creator=super_admin,
    )
    assert project.created_by_label == "SUPER:superadmin"

    step_1 = project.steps.get(position=1)
    res_status = client.post(
        f"/api/projects/{project.id}/steps/{step_1.id}/status/",
        {"status": "IN_PROGRESS"},
        format="json",
    )
    assert res_status.status_code == 200

    res_sub = client.post(
        f"/api/projects/{project.id}/sub-steps/",
        {"after_step_id": step_1.id, "name": "Super Substep"},
        format="json",
    )
    assert res_sub.status_code == 201
    sub_id = res_sub.json()["id"]

    res_del = client.delete(
        f"/api/projects/{project.id}/steps/{sub_id}/",
    )
    assert res_del.status_code == 204
