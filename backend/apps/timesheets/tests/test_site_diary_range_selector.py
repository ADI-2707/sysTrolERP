from datetime import date
from decimal import Decimal

import pytest
from rest_framework.exceptions import NotFound, ValidationError

from apps.accounts.models import User
from apps.projects.models import Project
from apps.timesheets.models import (
    Timesheet,
    TimesheetEntry,
    TimesheetPolicy,
    TimesheetRow,
    TimesheetWeekStatus,
)
from apps.timesheets.selectors import get_site_diary_range_data


@pytest.fixture
def site_diary_fixture(db):
    TimesheetPolicy.objects.all().delete()
    policy = TimesheetPolicy.objects.create(
        daily_regular_hours=Decimal("8.00"),
        overtime_threshold_daily=Decimal("8.00"),
        hour_step=Decimal("0.25"),
        break_duration_hours=Decimal("1.00"),
    )

    user = User.objects.create_user(
        email="site.engineer@example.com",
        employee_code="SYS-SITE-01",
        full_name="Site Test Engineer",
        role="EMPLOYEE",
    )

    project = Project.objects.create(
        code="PRJ-SITE-001",
        name="Global Commissioning Site",
        slug="prj-site-001",
        client_name="International Client",
        site_country="Oman",
        site_city_or_plant="Sohar Refinery",
        site_timezone="Asia/Muscat",
    )

    ts_week1 = Timesheet.objects.create(
        employee=user,
        week_start_date=date(2026, 10, 12),
        status=TimesheetWeekStatus.OPEN,
    )
    row_week1 = TimesheetRow.objects.create(
        timesheet=ts_week1,
        project=project,
    )

    TimesheetEntry.objects.create(
        row=row_week1,
        date=date(2026, 10, 14),
        hours=Decimal("9.00"),
        note="PLC calibration and diagnostics",
    )
    TimesheetEntry.objects.create(
        row=row_week1,
        date=date(2026, 10, 18),
        hours=Decimal("6.00"),
        note="Emergency Sunday loop check",
    )

    ts_week2 = Timesheet.objects.create(
        employee=user,
        week_start_date=date(2026, 10, 19),
        status=TimesheetWeekStatus.OPEN,
    )
    row_week2 = TimesheetRow.objects.create(
        timesheet=ts_week2,
        project=project,
    )

    TimesheetEntry.objects.create(
        row=row_week2,
        date=date(2026, 10, 19),
        hours=Decimal("8.00"),
        note="SCADA screen commissioning",
    )

    return {
        "user": user,
        "project": project,
        "policy": policy,
    }


@pytest.mark.django_db
def test_range_data_multi_week_aggregation(site_diary_fixture):
    user = site_diary_fixture["user"]
    project = site_diary_fixture["project"]

    data = get_site_diary_range_data(
        employee_id=user.id,
        project_id=project.id,
        start_date=date(2026, 10, 14),
        end_date=date(2026, 10, 20),
    )

    assert data["total_days"] == 7
    assert data["days_worked"] == 3
    assert data["rest_days_worked"] == 1
    assert data["total_hours"] == Decimal("23.00")
    assert data["total_regular_hours"] == Decimal("16.00")
    assert data["total_overtime_hours"] == Decimal("7.00")
    assert data["has_entries"] is True

    oct14 = next(d for d in data["days"] if d["date"] == date(2026, 10, 14))
    assert oct14["hours"] == Decimal("9.00")
    assert oct14["regular_hours"] == Decimal("8.00")
    assert oct14["overtime_hours"] == Decimal("1.00")
    assert oct14["note"] == "PLC calibration and diagnostics"

    oct18 = next(d for d in data["days"] if d["date"] == date(2026, 10, 18))
    assert oct18["hours"] == Decimal("6.00")
    assert oct18["regular_hours"] == Decimal("0.00")
    assert oct18["overtime_hours"] == Decimal("6.00")
    assert oct18["day_name"] == "Sun"

    oct15 = next(d for d in data["days"] if d["date"] == date(2026, 10, 15))
    assert oct15["hours"] == Decimal("0.00")
    assert oct15["regular_hours"] == Decimal("0.00")
    assert oct15["overtime_hours"] == Decimal("0.00")
    assert oct15["note"] == ""


@pytest.mark.django_db
def test_invalid_date_range_raises_validation_error(site_diary_fixture):
    user = site_diary_fixture["user"]
    project = site_diary_fixture["project"]

    with pytest.raises(ValidationError):
        get_site_diary_range_data(
            employee_id=user.id,
            project_id=project.id,
            start_date=date(2026, 10, 20),
            end_date=date(2026, 10, 14),
        )

    with pytest.raises(ValidationError):
        get_site_diary_range_data(
            employee_id=user.id,
            project_id=project.id,
            start_date=date(2025, 1, 1),
            end_date=date(2026, 2, 1),
        )


@pytest.mark.django_db
def test_nonexistent_employee_or_project_raises_not_found(site_diary_fixture):
    user = site_diary_fixture["user"]
    project = site_diary_fixture["project"]

    with pytest.raises(NotFound):
        get_site_diary_range_data(
            employee_id=99999,
            project_id=project.id,
            start_date=date(2026, 10, 14),
            end_date=date(2026, 10, 20),
        )

    with pytest.raises(NotFound):
        get_site_diary_range_data(
            employee_id=user.id,
            project_id=99999,
            start_date=date(2026, 10, 14),
            end_date=date(2026, 10, 20),
        )
