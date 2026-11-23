import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.audit.models import AuditLog
from apps.projects.models import ProjectAssignment
from apps.projects.services import create_project

@pytest.mark.django_db
def test_project_member_assignment_workflow():
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
        full_name="Employee One",
        role=UserRole.EMPLOYEE,
        password="ValidPassword123!",
    )
    emp2 = User.objects.create_user(
        employee_code="SYS-0003",
        email="emp2@example.com",
        full_name="Employee Two",
        role=UserRole.EMPLOYEE,
        password="ValidPassword123!",
    )
    emp3 = User.objects.create_user(
        employee_code="SYS-0004",
        email="emp3@example.com",
        full_name="Employee Three",
        role=UserRole.EMPLOYEE,
        password="ValidPassword123!",
    )

    project = create_project(
        name="Hydro Plant",
        creator=admin,
    )

    client = APIClient()
    client.force_login(emp1)

    res_forbidden = client.post(
        f"/api/projects/{project.id}/members/",
        {"user_id": emp2.id},
        format="json",
    )
    assert res_forbidden.status_code == 403

    client.force_login(admin)

    res_add = client.post(
        f"/api/projects/{project.id}/members/",
        {"user_id": emp1.id},
        format="json",
    )
    assert res_add.status_code == 201
    assert res_add.json()["employee_code"] == "SYS-0002"
    assert ProjectAssignment.objects.filter(project=project, employee=emp1).exists()
    assert AuditLog.objects.filter(action="PROJECT_MEMBER_ADD", entity_id=str(project.assignments.first().id)).exists()

    res_duplicate = client.post(
        f"/api/projects/{project.id}/members/",
        {"user_id": emp1.id},
        format="json",
    )
    assert res_duplicate.status_code == 400

    res_del = client.delete(
        f"/api/projects/{project.id}/members/{emp1.id}/",
    )
    assert res_del.status_code == 204
    assert not ProjectAssignment.objects.filter(project=project, employee=emp1).exists()
    assert AuditLog.objects.filter(action="PROJECT_MEMBER_REMOVE").exists()

    res_sync = client.put(
        f"/api/projects/{project.id}/members/",
        {"user_ids": [emp2.id, emp3.id]},
        format="json",
    )
    assert res_sync.status_code == 200
    synced_members = res_sync.json()
    assert len(synced_members) == 2
    assigned_codes = {m["employee_code"] for m in synced_members}
    assert assigned_codes == {"SYS-0003", "SYS-0004"}
    assert AuditLog.objects.filter(action="PROJECT_MEMBERS_SYNC", entity_id=str(project.id)).exists()
