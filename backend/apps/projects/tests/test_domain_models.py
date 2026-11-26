import pytest

from apps.accounts.models import User
from apps.projects.models import CORE_STEPS, Project, ProjectAssignment, ProjectStep, StepStatus


@pytest.mark.django_db
def test_project_domain_models_creation():
    assert len(CORE_STEPS) == 14
    assert CORE_STEPS[0][0] == "ENQUIRY"
    assert CORE_STEPS[-1][0] == "AMC"

    project = Project.objects.create(
        code="PRJ-2026-001",
        name="Automation Plant",
        slug="automation-plant",
        client_name="Tata Steel",
    )
    assert project.status == "ACTIVE"
    assert project.completion_percentage == 0.0

    step1 = ProjectStep.objects.create(
        project=project,
        key="ENQUIRY",
        name="Enquiry",
        position=1,
        status=StepStatus.COMPLETED,
    )
    step2 = ProjectStep.objects.create(
        project=project,
        key="SALES_VISIT",
        name="Sales Visit",
        position=2,
        status=StepStatus.NOT_STARTED,
    )

    assert project.completion_percentage == 50.0
    assert project.status == "ACTIVE"

    step2.status = StepStatus.COMPLETED
    step2.save()
    assert project.completion_percentage == 100.0
    assert project.status == "COMPLETED"

    user = User.objects.create_user(
        email="assignee@example.com",
        employee_code="SYS-0301",
        full_name="Assignee",
        password="ValidPassword123!",
    )
    assignment = ProjectAssignment.objects.create(
        project=project,
        employee=user,
    )
    assert assignment.pk is not None
    assert str(assignment) == "SYS-0301 -> PRJ-2026-001"
