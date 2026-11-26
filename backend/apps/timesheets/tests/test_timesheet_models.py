import datetime
from decimal import Decimal
import pytest
from django.db import IntegrityError, transaction
from apps.accounts.models import User, UserRole
from apps.projects.services import create_project
from apps.timesheets.models import (
    Timesheet,
    TimesheetEntry,
    TimesheetRow,
    TimesheetWeekStatus,
)

@pytest.mark.django_db
def test_timesheet_models_and_constraints():
    employee = User.objects.create_user(
        employee_code="SYS-0001",
        email="emp@example.com",
        full_name="Employee One",
        role=UserRole.EMPLOYEE,
        password="ValidPassword123!",
    )
    admin = User.objects.create_user(
        employee_code="SYS-0002",
        email="admin@example.com",
        full_name="Admin One",
        role=UserRole.ADMIN,
        password="ValidPassword123!",
    )
    project = create_project(
        name="Project Turbines",
        creator=admin,
        member_ids=[employee.id],
    )

    monday = datetime.date(2026, 11, 23)
    ts = Timesheet.objects.create(
        employee=employee,
        week_start_date=monday,
        status=TimesheetWeekStatus.OPEN,
    )
    assert ts.status == TimesheetWeekStatus.OPEN

    with transaction.atomic():
        with pytest.raises(IntegrityError):
            Timesheet.objects.create(
                employee=employee,
                week_start_date=monday,
                status=TimesheetWeekStatus.OPEN,
            )

    row = TimesheetRow.objects.create(
        timesheet=ts,
        project=project,
        description="Core implementation",
    )

    with transaction.atomic():
        with pytest.raises(IntegrityError):
            TimesheetRow.objects.create(
                timesheet=ts,
                project=project,
                description="Duplicate row",
            )

    entry = TimesheetEntry.objects.create(
        row=row,
        date=monday,
        hours=Decimal("8.00"),
        note="Sprint planning & coding",
    )
    assert entry.hours == Decimal("8.00")

    with transaction.atomic():
        with pytest.raises(IntegrityError):
            TimesheetEntry.objects.create(
                row=row,
                date=monday,
                hours=Decimal("4.00"),
            )

    zero_entry = TimesheetEntry.objects.create(
        row=row,
        date=datetime.date(2026, 11, 24),
        hours=Decimal("0.00"),
        note="Planning only, no hours yet",
    )
    assert zero_entry.hours == Decimal("0.00")

    with transaction.atomic():
        with pytest.raises(IntegrityError):
            TimesheetEntry.objects.create(
                row=row,
                date=datetime.date(2026, 11, 25),
                hours=Decimal("-1.00"),
            )

    with transaction.atomic():
        with pytest.raises(IntegrityError):
            TimesheetEntry.objects.create(
                row=row,
                date=datetime.date(2026, 11, 26),
                hours=Decimal("24.50"),
            )
