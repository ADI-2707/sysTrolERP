import pytest
import time_machine
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.projects.services import create_project
from apps.timesheets.models import TimesheetEntry


@pytest.mark.django_db
def test_bulk_cell_save():
    with time_machine.travel("2026-11-25 15:00:00+05:30"):
        admin = User.objects.create_user(
            employee_code="SYS-0001",
            email="admin@example.com",
            full_name="Admin User",
            role=UserRole.ADMIN,
            password="ValidPassword123!",
        )
        emp = User.objects.create_user(
            employee_code="SYS-0002",
            email="emp@example.com",
            full_name="Employee User",
            role=UserRole.EMPLOYEE,
            password="ValidPassword123!",
        )

        project1 = create_project(
            name="Substation Alpha",
            creator=admin,
            member_ids=[emp.id],
        )
        project2 = create_project(
            name="Substation Beta",
            creator=admin,
            member_ids=[emp.id],
        )

        client = APIClient()
        client.force_login(emp)

        payload = {
            "cells": [
                {
                    "project_id": project1.id,
                    "date": "2026-11-23",
                    "hours": "4.00",
                    "note": "Drafting specs",
                },
                {
                    "project_id": project2.id,
                    "date": "2026-11-23",
                    "hours": "4.00",
                    "note": "Reviewing components",
                },
                {
                    "project_id": project1.id,
                    "date": "2026-11-24",
                    "hours": "8.00",
                    "note": "CAD modeling",
                },
            ]
        }

        res = client.post("/api/timesheets/me/cells/bulk/", payload, format="json")
        assert res.status_code == 200
        data = res.json()
        assert data["saved_count"] == 3
        assert data["week"]["total_week_hours"] == "16.00"

        assert TimesheetEntry.objects.filter(row__project=project1).count() == 2
        assert TimesheetEntry.objects.filter(row__project=project2).count() == 1

        invalid_payload = {
            "cells": [
                {
                    "project_id": project1.id,
                    "date": "2026-11-25",
                    "hours": "5.00",
                },
                {
                    "project_id": project1.id,
                    "date": "2026-11-28",
                    "hours": "5.00",
                },
            ]
        }

        res_err = client.post("/api/timesheets/me/cells/bulk/", invalid_payload, format="json")
        assert res_err.status_code == 400

        assert not TimesheetEntry.objects.filter(date="2026-11-25").exists()
