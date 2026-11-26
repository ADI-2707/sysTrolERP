import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.audit.models import AuditLog
from apps.projects.services import create_project


@pytest.mark.django_db
def test_step_status_transitions():
    admin = User.objects.create_user(
        email="padmin.status@example.com",
        employee_code="SYS-0420",
        full_name="Admin Status",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    emp = User.objects.create_user(
        email="pemp.status@example.com",
        employee_code="SYS-0421",
        full_name="Emp Status",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )
    project = create_project(
        name="Boiler System",
        creator=admin,
    )
    first_step = project.steps.get(position=1)

    emp_client = APIClient()
    emp_client.force_authenticate(user=emp)
    emp_resp = emp_client.post(
        reverse("project_step_status", kwargs={"project_id": project.id, "step_id": first_step.id}),
        {"status": "INITIATED"},
        format="json",
    )
    assert emp_resp.status_code == 403

    admin_client = APIClient()
    admin_client.force_authenticate(user=admin)

    step_url = reverse(
        "project_step_status", kwargs={"project_id": project.id, "step_id": first_step.id}
    )

    init_resp = admin_client.post(step_url, {"status": "INITIATED"}, format="json")
    assert init_resp.status_code == 200
    assert init_resp.data["status"] == "INITIATED"

    in_prog_resp = admin_client.post(step_url, {"status": "IN_PROGRESS"}, format="json")
    assert in_prog_resp.status_code == 200
    assert in_prog_resp.data["status"] == "IN_PROGRESS"

    complete_no_confirm = admin_client.post(step_url, {"status": "COMPLETED"}, format="json")
    assert complete_no_confirm.status_code == 400
    assert "confirm" in complete_no_confirm.data["fields"]

    complete_resp = admin_client.post(
        step_url, {"status": "COMPLETED", "confirm": True}, format="json"
    )
    assert complete_resp.status_code == 200
    assert complete_resp.data["status"] == "COMPLETED"
    assert complete_resp.data["confirmed_at"] is not None
    assert complete_resp.data["confirmed_by_label"] == "SYS-0420"

    backward_resp = admin_client.post(step_url, {"status": "IN_PROGRESS"}, format="json")
    assert backward_resp.status_code == 400
    assert "status" in backward_resp.data["fields"]

    audit = AuditLog.objects.filter(
        action="STEP_STATUS_CHANGE", entity_id=str(first_step.id)
    ).first()
    assert audit is not None
