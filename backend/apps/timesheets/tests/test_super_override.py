import datetime
from decimal import Decimal
import pytest
from rest_framework.test import APIClient
import time_machine
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
def test_super_admin_timesheet_override():
    with time_machine.travel("2026-11-25 10:00:00+05:30"):
        admin = User.objects.create_user(
            employee_code="SYS-0001",
            email="admin@example.com",
            full_name="Admin One",
            role=UserRole.ADMIN,
            password="ValidPassword123!",
        )
        emp = User.objects.create_user(
            employee_code="SYS-0002",
            email="emp@example.com",
            full_name="Employee Two",
            role=UserRole.EMPLOYEE,
            password="ValidPassword123!",
        )
        project = create_project(
            name="Plant Delta",
            creator=admin,
            member_ids=[emp.id],
        )

        monday = datetime.date(2026, 11, 23)
        ts = Timesheet.objects.create(
            employee=emp,
            week_start_date=monday,
            status=TimesheetWeekStatus.APPROVED,
        )
        row = TimesheetRow.objects.create(timesheet=ts, project=project)
        entry = TimesheetEntry.objects.create(row=row, date=monday, hours=Decimal("8.00"))

        admin_client = APIClient()
        admin_client.force_login(admin)
        res_admin = admin_client.put(
            f"/api/timesheets/{ts.id}/override/",
            {"reason": "Attempt by admin"},
            format="json",
        )
        assert res_admin.status_code == 403

        super_client = APIClient()
        session = super_client.session
        session["is_super_admin"] = True
        session["super_admin_username"] = "superadmin"
        session.save()

        res_no_reason = super_client.put(
            f"/api/timesheets/{ts.id}/override/",
            {"reason": "   "},
            format="json",
        )
        assert res_no_reason.status_code == 400

        res_override = super_client.put(
            f"/api/timesheets/{ts.id}/override/",
            {
                "reason": "Payroll adjustment approved by CFO",
                "status": "APPROVED",
                "cells": [
                    {
                        "project_id": project.id,
                        "date": "2026-11-23",
                        "hours": "10.00",
                        "note": "Adjusted hours",
                    }
                ],
            },
            format="json",
        )
        assert res_override.status_code == 200
        data = res_override.json()
        assert data["total_week_hours"] == "10.00"

        entry.refresh_from_db()
        assert entry.hours == Decimal("10.00")
        assert entry.note == "Adjusted hours"

        audit_entry = AuditLog.objects.filter(
            action="TIMESHEET_SUPER_OVERRIDE",
            entity_id=str(ts.id),
        ).first()
        assert audit_entry is not None
        assert audit_entry.super_only is True
        assert "Payroll adjustment" in audit_entry.summary
