import pytest

from apps.accounts.models import User, UserRole
from apps.audit.models import AuditLog
from apps.projects.models import CORE_STEPS, StepStatus
from apps.projects.services import create_project


@pytest.mark.django_db
def test_create_project_seeds_fourteen_steps_and_members():
    admin = User.objects.create_user(
        email="proj.admin@example.com",
        employee_code="SYS-0350",
        full_name="Proj Admin",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    emp1 = User.objects.create_user(
        email="proj.emp1@example.com",
        employee_code="SYS-0351",
        full_name="Proj Emp 1",
        password="ValidPassword123!",
    )
    emp2 = User.objects.create_user(
        email="proj.emp2@example.com",
        employee_code="SYS-0352",
        full_name="Proj Emp 2",
        password="ValidPassword123!",
    )

    project = create_project(
        name="Hydraulic System Overhaul",
        creator=admin,
        client_name="JSW Steel",
        description="Comprehensive overhaul of hydraulic press",
        member_ids=[emp1.id, emp2.id],
    )

    assert project.code.startswith("PRJ-")
    assert project.slug == "hydraulic-system-overhaul"
    assert project.is_active is True
    assert project.created_by == admin
    assert project.created_by_label == "SYS-0350"

    steps = list(project.steps.order_by("position"))
    assert len(steps) == 14
    for i, (expected_key, expected_name) in enumerate(CORE_STEPS, start=1):
        step = steps[i - 1]
        assert step.position == i
        assert step.key == expected_key
        assert step.name == expected_name
        assert step.is_custom is False
        assert step.status == StepStatus.NOT_STARTED

    assignments = list(project.assignments.select_related("employee"))
    assert len(assignments) == 2
    assigned_codes = {a.employee.employee_code for a in assignments}
    assert assigned_codes == {"SYS-0351", "SYS-0352"}

    audit = AuditLog.objects.filter(action="PROJECT_CREATE", entity_id=str(project.id)).first()
    assert audit is not None
    assert audit.actor_user == admin
