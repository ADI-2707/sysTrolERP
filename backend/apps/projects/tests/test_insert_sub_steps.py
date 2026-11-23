import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.audit.models import AuditLog
from apps.projects.models import ProjectStep, StepStatus
from apps.projects.services import create_project

@pytest.mark.django_db
def test_insert_sub_step_lifecycle():
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
        name="Industrial Plant Upgrade",
        creator=admin,
        client_name="Acme Corp",
    )

    client = APIClient()
    client.force_login(employee)
    first_step = project.steps.get(position=1)
    res = client.post(
        f"/api/projects/{project.id}/sub-steps/",
        {"after_step_id": first_step.id, "name": "Preliminary Review"},
        format="json",
    )
    assert res.status_code == 403

    client.force_login(admin)
    res = client.post(
        f"/api/projects/{project.id}/sub-steps/",
        {"after_step_id": first_step.id, "name": "Preliminary Review"},
        format="json",
    )
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Preliminary Review"
    assert data["position"] == 2
    assert data["is_custom"] is True
    assert data["status"] == "NOT_STARTED"

    step_3 = project.steps.get(position=3)
    assert step_3.key == "SALES_VISIT"

    audit_entry = AuditLog.objects.filter(action="SUB_STEP_CREATE", entity_id=str(data["id"])).first()
    assert audit_entry is not None
    assert audit_entry.actor_user == admin

    amc_step = project.steps.get(key="AMC")
    res_amc = client.post(
        f"/api/projects/{project.id}/sub-steps/",
        {"after_step_id": amc_step.id, "name": "After AMC"},
        format="json",
    )
    assert res_amc.status_code == 400
    assert "AMC" in str(res_amc.json())

    target_step = project.steps.get(key="ENGINEERING")
    target_step.status = StepStatus.COMPLETED
    target_step.save()

    earlier_step = project.steps.get(key="PROCUREMENT")
    res_early = client.post(
        f"/api/projects/{project.id}/sub-steps/",
        {"after_step_id": earlier_step.id, "name": "Too Early"},
        format="json",
    )
    assert res_early.status_code == 400
    assert "completed" in str(res_early.json()).lower()

    res_after_completed = client.post(
        f"/api/projects/{project.id}/sub-steps/",
        {"after_step_id": target_step.id, "name": "Design Checkpoint"},
        format="json",
    )
    assert res_after_completed.status_code == 201
    assert res_after_completed.json()["position"] == target_step.position + 1

@pytest.mark.django_db
def test_insert_sub_step_limit_30():
    admin = User.objects.create_user(
        employee_code="SYS-0001",
        email="admin@example.com",
        full_name="Admin User",
        role=UserRole.ADMIN,
        password="ValidPassword123!",
    )
    project = create_project(
        name="Big Factory",
        creator=admin,
    )

    client = APIClient()
    client.force_login(admin)

    step_1 = project.steps.get(position=1)
    for i in range(28):
        ProjectStep.objects.create(
            project=project,
            name=f"Manual Custom {i}",
            position=100 + i,
            is_custom=True,
            status=StepStatus.NOT_STARTED,
        )

    res_29 = client.post(
        f"/api/projects/{project.id}/sub-steps/",
        {"after_step_id": step_1.id, "name": "Custom Step 29"},
        format="json",
    )
    assert res_29.status_code == 201

    res_30 = client.post(
        f"/api/projects/{project.id}/sub-steps/",
        {"after_step_id": step_1.id, "name": "Custom Step 30"},
        format="json",
    )
    assert res_30.status_code == 201

    res_31 = client.post(
        f"/api/projects/{project.id}/sub-steps/",
        {"after_step_id": step_1.id, "name": "Custom Step 31"},
        format="json",
    )
    assert res_31.status_code == 400
    assert "30" in str(res_31.json())
