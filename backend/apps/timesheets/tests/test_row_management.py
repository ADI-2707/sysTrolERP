import pytest
from rest_framework.test import APIClient
import time_machine
from apps.accounts.models import User, UserRole
from apps.projects.services import create_project
from apps.timesheets.models import (
    Timesheet,
    TimesheetRow,
    TimesheetWeekStatus,
)

@pytest.mark.django_db
def test_timesheet_row_management_lifecycle():
    with time_machine.travel("2026-11-25 10:00:00+05:30"):
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

        project1 = create_project(
            name="Plant Alpha",
            creator=admin,
            member_ids=[emp1.id],
        )
        project2 = create_project(
            name="Plant Beta",
            creator=admin,
            member_ids=[emp2.id],
        )

        client = APIClient()
        client.force_login(emp1)

        res_unassigned = client.post(
            "/api/timesheets/me/rows/",
            {"project_id": project2.id},
            format="json",
        )
        assert res_unassigned.status_code == 400

        res_create = client.post(
            "/api/timesheets/me/rows/",
            {"project_id": project1.id, "description": "Mechanical design"},
            format="json",
        )
        assert res_create.status_code == 201
        row_id = res_create.json()["id"]
        assert res_create.json()["project"]["code"] == project1.code
        assert len(res_create.json()["entries"]) == 7

        res_dup = client.post(
            "/api/timesheets/me/rows/",
            {"project_id": project1.id},
            format="json",
        )
        assert res_dup.status_code == 400

        other_client = APIClient()
        other_client.force_login(emp2)
        res_other_del = other_client.delete(f"/api/timesheets/me/rows/{row_id}/")
        assert res_other_del.status_code == 400

        res_del = client.delete(f"/api/timesheets/me/rows/{row_id}/")
        assert res_del.status_code == 204
        assert not TimesheetRow.objects.filter(id=row_id).exists()

        res_recreate = client.post(
            "/api/timesheets/me/rows/",
            {"project_id": project1.id},
            format="json",
        )
        assert res_recreate.status_code == 201
        new_row_id = res_recreate.json()["id"]

        ts = Timesheet.objects.get(employee=emp1, week_start_date="2026-11-23")
        ts.status = TimesheetWeekStatus.SUBMITTED
        ts.save()

        res_del_locked = client.delete(f"/api/timesheets/me/rows/{new_row_id}/")
        assert res_del_locked.status_code == 400
