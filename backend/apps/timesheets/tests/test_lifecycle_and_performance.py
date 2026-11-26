import datetime
from decimal import Decimal

import pytest
import time_machine
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.audit.models import AuditLog
from apps.projects.services import create_project
from apps.timesheets.models import (
    Timesheet,
    TimesheetEntry,
    TimesheetRow,
    TimesheetWeekStatus,
)


@pytest.mark.django_db
def test_full_timesheet_lifecycle():
    with time_machine.travel("2026-11-25 10:00:00+05:30"):
        admin1 = User.objects.create_user(
            employee_code="SYS-0001",
            email="admin1@example.com",
            full_name="Admin One",
            role=UserRole.ADMIN,
            password="ValidPassword123!",
        )
        admin2 = User.objects.create_user(
            employee_code="SYS-0002",
            email="admin2@example.com",
            full_name="Admin Two",
            role=UserRole.ADMIN,
            password="ValidPassword123!",
        )
        emp = User.objects.create_user(
            employee_code="SYS-0003",
            email="emp@example.com",
            full_name="Employee Three",
            role=UserRole.EMPLOYEE,
            password="ValidPassword123!",
        )

        project = create_project(
            name="Plant Delta",
            creator=admin1,
            member_ids=[emp.id],
        )

        emp_client = APIClient()
        emp_client.force_login(emp)

        res_init = emp_client.get("/api/timesheets/me/")
        assert res_init.status_code == 200
        assert res_init.json()["status"] == "OPEN"
        assert res_init.json()["can_edit"] is True

        res_row = emp_client.post(
            "/api/timesheets/me/rows/",
            {"project_id": project.id, "description": "Phase 1 Testing"},
            format="json",
        )
        assert res_row.status_code == 201

        res_cells = emp_client.post(
            "/api/timesheets/me/cells/bulk/",
            {
                "cells": [
                    {
                        "project_id": project.id,
                        "date": "2026-11-23",
                        "hours": "8.00",
                        "note": "Day 1 work",
                    },
                    {
                        "project_id": project.id,
                        "date": "2026-11-24",
                        "hours": "8.00",
                        "note": "Day 2 work",
                    },
                ]
            },
            format="json",
        )
        assert res_cells.status_code == 200

        res_submit = emp_client.post("/api/timesheets/me/submit/", {}, format="json")
        assert res_submit.status_code == 200
        assert res_submit.json()["status"] == "SUBMITTED"

        res_blocked_edit = emp_client.put(
            "/api/timesheets/me/cells/",
            {
                "project_id": project.id,
                "date": "2026-11-25",
                "hours": "8.00",
            },
            format="json",
        )
        assert res_blocked_edit.status_code == 400

        admin1_client = APIClient()
        admin1_client.force_login(admin1)

        res_pending = admin1_client.get("/api/timesheets/pending/")
        assert res_pending.status_code == 200
        assert res_pending.json()["count"] == 1
        ts_id = res_pending.json()["results"][0]["id"]

        res_return = admin1_client.post(
            f"/api/timesheets/{ts_id}/return/",
            {"reason": "Please log hours for Wednesday"},
            format="json",
        )
        assert res_return.status_code == 200
        assert res_return.json()["status"] == "RETURNED"

        res_me_returned = emp_client.get("/api/timesheets/me/")
        assert res_me_returned.status_code == 200
        assert res_me_returned.json()["status"] == "RETURNED"
        assert res_me_returned.json()["return_reason"] == "Please log hours for Wednesday"

        res_fix = emp_client.put(
            "/api/timesheets/me/cells/",
            {
                "project_id": project.id,
                "date": "2026-11-25",
                "hours": "8.00",
                "note": "Day 3 corrected",
            },
            format="json",
        )
        assert res_fix.status_code == 200

        res_resubmit = emp_client.post("/api/timesheets/me/submit/", {}, format="json")
        assert res_resubmit.status_code == 200
        assert res_resubmit.json()["status"] == "SUBMITTED"

        admin2_client = APIClient()
        admin2_client.force_login(admin2)

        res_approve = admin2_client.post(f"/api/timesheets/{ts_id}/approve/", {})
        assert res_approve.status_code == 200
        assert res_approve.json()["status"] == "APPROVED"

        super_client = APIClient()
        session = super_client.session
        session["is_super_admin"] = True
        session["super_admin_username"] = "superadmin"
        session.save()

        res_override = super_client.put(
            f"/api/timesheets/{ts_id}/override/",
            {
                "reason": "Audited OT adjustment by Super Admin",
                "status": "APPROVED",
                "cells": [
                    {
                        "project_id": project.id,
                        "date": "2026-11-25",
                        "hours": "10.00",
                        "note": "2h overtime verified",
                    }
                ],
            },
            format="json",
        )
        assert res_override.status_code == 200
        assert res_override.json()["total_week_hours"] == "26.00"

        assert AuditLog.objects.filter(action="TIMESHEET_SUBMIT", entity_id=str(ts_id)).exists()
        assert AuditLog.objects.filter(action="TIMESHEET_RETURN", entity_id=str(ts_id)).exists()
        assert AuditLog.objects.filter(action="TIMESHEET_APPROVE", entity_id=str(ts_id)).exists()
        assert AuditLog.objects.filter(
            action="TIMESHEET_SUPER_OVERRIDE", entity_id=str(ts_id)
        ).exists()


@pytest.mark.django_db
def test_admin_timesheet_listing_query_count(django_assert_num_queries):
    admin = User.objects.create_user(
        employee_code="SYS-0001",
        email="admin@example.com",
        full_name="Admin One",
        role=UserRole.ADMIN,
        password="ValidPassword123!",
    )
    project = create_project(
        name="Performance Substation",
        creator=admin,
    )

    monday = datetime.date(2026, 11, 23)

    for i in range(10):
        emp = User.objects.create_user(
            employee_code=f"SYS-{1000 + i}",
            email=f"emp{i}@example.com",
            full_name=f"Emp {i}",
            role=UserRole.EMPLOYEE,
            password="ValidPassword123!",
        )
        ts = Timesheet.objects.create(
            employee=emp,
            week_start_date=monday,
            status=TimesheetWeekStatus.SUBMITTED,
        )
        row = TimesheetRow.objects.create(timesheet=ts, project=project)
        for day_offset in range(5):
            TimesheetEntry.objects.create(
                row=row,
                date=monday + datetime.timedelta(days=day_offset),
                hours=Decimal("8.00"),
            )

    client = APIClient()
    client.force_login(admin)

    with django_assert_num_queries(7):
        res1 = client.get("/api/timesheets/")
        assert res1.status_code == 200
        assert res1.json()["count"] == 10

    for i in range(10, 20):
        emp = User.objects.create_user(
            employee_code=f"SYS-{1000 + i}",
            email=f"emp{i}@example.com",
            full_name=f"Emp {i}",
            role=UserRole.EMPLOYEE,
            password="ValidPassword123!",
        )
        ts = Timesheet.objects.create(
            employee=emp,
            week_start_date=monday,
            status=TimesheetWeekStatus.SUBMITTED,
        )
        row = TimesheetRow.objects.create(timesheet=ts, project=project)
        for day_offset in range(5):
            TimesheetEntry.objects.create(
                row=row,
                date=monday + datetime.timedelta(days=day_offset),
                hours=Decimal("8.00"),
            )

    with django_assert_num_queries(7):
        res2 = client.get("/api/timesheets/")
        assert res2.status_code == 200
        assert res2.json()["count"] == 20
