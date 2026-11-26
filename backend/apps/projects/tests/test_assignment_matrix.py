import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.projects.services import create_project


@pytest.mark.django_db
def test_assignment_matrix_endpoint():
    admin = User.objects.create_user(
        employee_code="SYS-0001",
        email="admin@example.com",
        full_name="Admin User",
        role=UserRole.ADMIN,
        password="ValidPassword123!",
    )
    emp1 = User.objects.create_user(
        employee_code="SYS-0002",
        email="emp1@example.com",
        full_name="Active Emp",
        role=UserRole.EMPLOYEE,
        password="ValidPassword123!",
    )
    emp_inactive = User.objects.create_user(
        employee_code="SYS-0003",
        email="emp_inactive@example.com",
        full_name="Inactive Emp",
        role=UserRole.EMPLOYEE,
        is_active=False,
        password="ValidPassword123!",
    )

    prj_active = create_project(
        name="Active Project",
        creator=admin,
        member_ids=[emp1.id, emp_inactive.id],
    )
    prj_inactive = create_project(
        name="Inactive Project",
        creator=admin,
        member_ids=[emp1.id],
    )
    prj_inactive.is_active = False
    prj_inactive.save()

    client = APIClient()
    client.force_login(emp1)
    res_forbidden = client.get("/api/projects/matrix/")
    assert res_forbidden.status_code == 403

    client.force_login(admin)
    res = client.get("/api/projects/matrix/")
    assert res.status_code == 200
    data = res.json()

    assert "employees" in data
    assert "projects" in data
    assert "assignments" in data

    emp_codes = [e["code"] for e in data["employees"]]
    assert "SYS-0001" in emp_codes
    assert "SYS-0002" in emp_codes
    assert "SYS-0003" not in emp_codes

    prj_codes = [p["code"] for p in data["projects"]]
    assert prj_active.code in prj_codes
    assert prj_inactive.code not in prj_codes

    assigned_pairs = [(a["project_id"], a["employee_id"]) for a in data["assignments"]]
    assert (prj_active.id, emp1.id) in assigned_pairs
    assert (prj_active.id, emp_inactive.id) not in assigned_pairs
    assert (prj_inactive.id, emp1.id) not in assigned_pairs
