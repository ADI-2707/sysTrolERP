import time
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from apps.accounts.models import User
from apps.core.timezone import company_today, week_bounds
from apps.projects.models import Project, ProjectAssignment
from apps.timesheets.models import (
    Timesheet,
    TimesheetEntry,
    TimesheetRow,
    TimesheetWeekStatus,
)
from apps.timesheets.services import bulk_upsert_timesheet_cells


@pytest.mark.django_db(transaction=True)
def test_concurrent_timesheet_cell_upserts():
    employee = User.objects.create_user(
        full_name="Load Employee",
        employee_code="SYS-LOAD-1",
        email="load1@systrol.local",
        password="Password123!",
        role="EMPLOYEE",
    )
    project = Project.objects.create(code="PRJ-L1", name="Load Project 1", slug="prj-l1")
    ProjectAssignment.objects.create(project=project, employee=employee)

    today = company_today()
    monday, _ = week_bounds(today)

    timesheet = Timesheet.objects.create(
        employee=employee,
        week_start_date=monday,
        status=TimesheetWeekStatus.OPEN,
    )
    row = TimesheetRow.objects.create(timesheet=timesheet, project=project)
    row_id = row.id

    if connection.vendor == "sqlite":
        start_time = time.perf_counter()
        for idx in range(20):
            TimesheetEntry.objects.update_or_create(
                row=row,
                date=monday,
                defaults={
                    "hours": Decimal(f"{(idx % 8) + 1}.00"),
                    "note": f"Rapid upsert {idx}",
                },
            )
        elapsed = time.perf_counter() - start_time
        assert elapsed < 1.0
    else:
        connection.close()

        def worker(idx):
            connection.close()
            r = TimesheetRow.objects.get(id=row_id)
            entry, _ = TimesheetEntry.objects.update_or_create(
                row=r,
                date=monday,
                defaults={
                    "hours": Decimal(f"{(idx % 8) + 1}.00"),
                    "note": f"Concurrent upsert {idx}",
                },
            )
            connection.close()
            return entry.id

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(worker, i) for i in range(16)]
            results = [f.result() for f in futures]
        assert len(results) == 16

    assert TimesheetEntry.objects.filter(row_id=row_id).count() == 1


@pytest.mark.django_db
def test_bulk_cell_upsert_query_efficiency():
    employee = User.objects.create_user(
        full_name="Bulk Employee",
        employee_code="SYS-LOAD-2",
        email="load2@systrol.local",
        password="Password123!",
        role="EMPLOYEE",
    )
    projects = [
        Project.objects.create(code=f"PRJ-BULK-{i}", name=f"Bulk {i}", slug=f"prj-bulk-{i}")
        for i in range(5)
    ]
    for p in projects:
        ProjectAssignment.objects.create(project=p, employee=employee)

    today = company_today()
    monday, _ = week_bounds(today)
    timesheet = Timesheet.objects.create(
        employee=employee,
        week_start_date=monday,
        status=TimesheetWeekStatus.OPEN,
    )
    rows = [TimesheetRow.objects.create(timesheet=timesheet, project=p) for p in projects]

    payload = []
    for r in rows:
        payload.append(
            {
                "project_id": r.project_id,
                "date": monday,
                "hours": Decimal("2.00"),
                "note": "Bulk efficiency test",
            }
        )

    with CaptureQueriesContext(connection) as ctx:
        res = bulk_upsert_timesheet_cells(
            user=employee,
            cells=payload,
        )

    assert res["saved_count"] == 5
    assert len(ctx.captured_queries) <= 100
    assert TimesheetEntry.objects.filter(row__timesheet=timesheet).count() == 5


@pytest.mark.django_db
def test_database_indexes_and_constraints_present():
    cursor = connection.cursor()
    entry_constraints = connection.introspection.get_constraints(
        cursor,
        TimesheetEntry._meta.db_table,
    )
    has_row_date_unique = any(
        c.get("unique") and set(c.get("columns", [])) == {"row_id", "date"}
        for c in entry_constraints.values()
    )
    assert has_row_date_unique

    timesheet_constraints = connection.introspection.get_constraints(
        cursor,
        Timesheet._meta.db_table,
    )
    has_employee_week_unique = any(
        c.get("unique") and set(c.get("columns", [])) == {"employee_id", "week_start_date"}
        for c in timesheet_constraints.values()
    )
    assert has_employee_week_unique
