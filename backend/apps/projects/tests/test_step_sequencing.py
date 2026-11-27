import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.projects.models import StepStatus
from apps.projects.services import create_project


@pytest.fixture
def admin_user():
    return User.objects.create_user(
        email="seq.admin@example.com",
        employee_code="SYS-0991",
        full_name="Sequence Admin",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )


@pytest.fixture
def api_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def sample_project(admin_user):
    return create_project(
        name="Sequencing Test Project",
        creator=admin_user,
    )


@pytest.mark.django_db
def test_step_1_can_initiate_without_predecessor(api_client, sample_project):
    step_1 = sample_project.steps.get(position=1)
    url = reverse(
        "project_step_status",
        kwargs={"project_id": sample_project.id, "step_id": step_1.id},
    )
    resp = api_client.post(url, {"status": "INITIATED"}, format="json")
    assert resp.status_code == 200
    assert resp.data["status"] == "INITIATED"


@pytest.mark.django_db
def test_step_2_cannot_initiate_if_step_1_not_started(api_client, sample_project):
    step_2 = sample_project.steps.get(position=2)
    url = reverse(
        "project_step_status",
        kwargs={"project_id": sample_project.id, "step_id": step_2.id},
    )
    resp = api_client.post(url, {"status": "INITIATED"}, format="json")
    assert resp.status_code == 400
    assert "status" in resp.data["fields"]


@pytest.mark.django_db
def test_step_2_cannot_initiate_if_step_1_is_only_initiated(api_client, sample_project):
    step_1 = sample_project.steps.get(position=1)
    step_2 = sample_project.steps.get(position=2)

    url_1 = reverse(
        "project_step_status",
        kwargs={"project_id": sample_project.id, "step_id": step_1.id},
    )
    resp_1 = api_client.post(url_1, {"status": "INITIATED"}, format="json")
    assert resp_1.status_code == 200

    url_2 = reverse(
        "project_step_status",
        kwargs={"project_id": sample_project.id, "step_id": step_2.id},
    )
    resp_2 = api_client.post(url_2, {"status": "INITIATED"}, format="json")
    assert resp_2.status_code == 400
    assert "status" in resp_2.data["fields"]


@pytest.mark.django_db
def test_step_2_can_initiate_when_step_1_is_in_progress(api_client, sample_project):
    step_1 = sample_project.steps.get(position=1)
    step_2 = sample_project.steps.get(position=2)

    step_1.status = StepStatus.IN_PROGRESS
    step_1.save(update_fields=["status"])

    url_2 = reverse(
        "project_step_status",
        kwargs={"project_id": sample_project.id, "step_id": step_2.id},
    )
    resp_2 = api_client.post(url_2, {"status": "INITIATED"}, format="json")
    assert resp_2.status_code == 200
    assert resp_2.data["status"] == "INITIATED"


@pytest.mark.django_db
def test_step_2_can_initiate_when_step_1_is_completed(api_client, sample_project):
    step_1 = sample_project.steps.get(position=1)
    step_2 = sample_project.steps.get(position=2)

    step_1.status = StepStatus.COMPLETED
    step_1.save(update_fields=["status"])

    url_2 = reverse(
        "project_step_status",
        kwargs={"project_id": sample_project.id, "step_id": step_2.id},
    )
    resp_2 = api_client.post(url_2, {"status": "INITIATED"}, format="json")
    assert resp_2.status_code == 200
    assert resp_2.data["status"] == "INITIATED"


@pytest.mark.django_db
def test_step_2_can_initiate_when_step_1_is_skipped(api_client, sample_project):
    step_1 = sample_project.steps.get(position=1)
    step_2 = sample_project.steps.get(position=2)

    step_1.status = StepStatus.SKIPPED
    step_1.save(update_fields=["status"])

    url_2 = reverse(
        "project_step_status",
        kwargs={"project_id": sample_project.id, "step_id": step_2.id},
    )
    resp_2 = api_client.post(url_2, {"status": "INITIATED"}, format="json")
    assert resp_2.status_code == 200
    assert resp_2.data["status"] == "INITIATED"


@pytest.mark.django_db
def test_step_skip_requires_confirmation(api_client, sample_project):
    step_1 = sample_project.steps.get(position=1)
    url = reverse(
        "project_step_status",
        kwargs={"project_id": sample_project.id, "step_id": step_1.id},
    )
    resp = api_client.post(url, {"status": "SKIPPED", "confirm": False}, format="json")
    assert resp.status_code == 400
    assert "confirm" in resp.data["fields"]


@pytest.mark.django_db
def test_step_skip_records_reason_and_audit(api_client, sample_project, admin_user):
    step_1 = sample_project.steps.get(position=1)
    url = reverse(
        "project_step_status",
        kwargs={"project_id": sample_project.id, "step_id": step_1.id},
    )
    resp = api_client.post(
        url,
        {
            "status": "SKIPPED",
            "confirm": True,
            "skip_reason": "Client bypassed enquiry and submitted direct RFP.",
        },
        format="json",
    )
    assert resp.status_code == 200
    assert resp.data["status"] == "SKIPPED"
    assert resp.data["skip_reason"] == "Client bypassed enquiry and submitted direct RFP."
    assert resp.data["confirmed_by_label"] == admin_user.employee_code

    step_1.refresh_from_db()
    assert step_1.status == StepStatus.SKIPPED
    assert step_1.skip_reason == "Client bypassed enquiry and submitted direct RFP."


@pytest.mark.django_db
def test_terminal_states_cannot_be_modified(api_client, sample_project):
    step_1 = sample_project.steps.get(position=1)
    step_1.status = StepStatus.SKIPPED
    step_1.save(update_fields=["status"])

    url = reverse(
        "project_step_status",
        kwargs={"project_id": sample_project.id, "step_id": step_1.id},
    )
    resp = api_client.post(url, {"status": "IN_PROGRESS"}, format="json")
    assert resp.status_code == 400
    assert "status" in resp.data["fields"]


@pytest.mark.django_db
def test_closure_hard_gate_blocks_if_any_prior_step_unresolved(api_client, sample_project):
    mom_step = sample_project.steps.get(key="MOM_AND_HANDOVER")
    for step in sample_project.steps.filter(position__lt=mom_step.position):
        step.status = StepStatus.COMPLETED
        step.save(update_fields=["status"])

    cold_trial = sample_project.steps.get(key="COLD_TRIAL")
    cold_trial.status = StepStatus.IN_PROGRESS
    cold_trial.save(update_fields=["status"])

    url = reverse(
        "project_step_status",
        kwargs={"project_id": sample_project.id, "step_id": mom_step.id},
    )
    resp = api_client.post(url, {"status": "INITIATED"}, format="json")
    assert resp.status_code == 400
    assert "status" in resp.data["fields"]


@pytest.mark.django_db
def test_closure_hard_gate_allows_when_all_prior_steps_completed_or_skipped(api_client, sample_project):
    mom_step = sample_project.steps.get(key="MOM_AND_HANDOVER")
    for step in sample_project.steps.filter(position__lt=mom_step.position):
        if step.key == "SALES_VISIT":
            step.status = StepStatus.SKIPPED
        else:
            step.status = StepStatus.COMPLETED
        step.save(update_fields=["status"])

    url = reverse(
        "project_step_status",
        kwargs={"project_id": sample_project.id, "step_id": mom_step.id},
    )
    resp = api_client.post(url, {"status": "INITIATED"}, format="json")
    assert resp.status_code == 200
    assert resp.data["status"] == "INITIATED"


@pytest.mark.django_db
def test_amc_hard_gate_blocks_if_prior_steps_unresolved(api_client, sample_project):
    amc_step = sample_project.steps.get(key="AMC")
    url = reverse(
        "project_step_status",
        kwargs={"project_id": sample_project.id, "step_id": amc_step.id},
    )
    resp = api_client.post(url, {"status": "INITIATED"}, format="json")
    assert resp.status_code == 400
    assert "status" in resp.data["fields"]


@pytest.mark.django_db
def test_completion_percentage_and_status_with_skipped_steps(api_client, sample_project):
    all_steps = list(sample_project.steps.all())
    for s in all_steps[:-2]:
        s.status = StepStatus.COMPLETED
        s.save(update_fields=["status"])

    all_steps[-2].status = StepStatus.SKIPPED
    all_steps[-2].save(update_fields=["status"])

    all_steps[-1].status = StepStatus.COMPLETED
    all_steps[-1].save(update_fields=["status"])

    assert sample_project.completion_percentage == 100.0
    assert sample_project.status == "COMPLETED"
