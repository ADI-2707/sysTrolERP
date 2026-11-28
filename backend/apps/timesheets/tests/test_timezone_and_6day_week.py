import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

import pytest
from django.utils import timezone

from apps.accounts.models import User
from apps.core.timezone import company_today, get_effective_today
from apps.projects.models import Project
from apps.timesheets.models import Timesheet, TimesheetEntry, TimesheetPolicy, TimesheetRow
from apps.timesheets.rules import is_cell_editable
from apps.timesheets.selectors import get_own_timesheet


@pytest.mark.django_db
def test_effective_today_handles_international_zones():
    base_today = company_today()
    assert get_effective_today() == base_today
    assert get_effective_today("Invalid/Timezone_Not_Real") == base_today
    assert get_effective_today(None, "Invalid/Another_Fake") == base_today

    now_utc = timezone.now()
    tokyo_date = now_utc.astimezone(ZoneInfo("Asia/Tokyo")).date()
    effective = get_effective_today(client_tz_name="Asia/Tokyo")
    assert effective >= base_today
    assert effective >= tokyo_date


@pytest.mark.django_db
def test_project_site_timezone_permits_local_date_editing():
    project = Project.objects.create(
        code="PRJ-JPN-001",
        name="Japan Commissioning Project",
        slug="prj-jpn-001",
        site_country="Japan",
        site_city_or_plant="Tokyo Plant 1",
        site_timezone="Asia/Tokyo",
    )

    now_utc = timezone.now()
    tokyo_date = now_utc.astimezone(ZoneInfo("Asia/Tokyo")).date()
    tokyo_monday = tokyo_date - datetime.timedelta(days=tokyo_date.weekday())

    effective = get_effective_today(project_tz_name=project.site_timezone)

    editable = is_cell_editable(
        cell_date=tokyo_date,
        week_start_date=tokyo_monday,
        week_status="OPEN",
        project_is_active=True,
        is_assigned=True,
        today=effective,
    )
    assert editable is True


@pytest.mark.django_db
def test_six_day_work_week_and_sunday_overtime_calculation():
    user = User.objects.create_user(
        email="onsite_engineer@example.com",
        employee_code="SYS-0301",
        full_name="Onsite Engineer",
        password="Password123!",
    )
    project = Project.objects.create(
        code="PRJ-OMN-001",
        name="Oman Automation",
        slug="prj-omn-001",
        site_country="Oman",
        site_timezone="Asia/Muscat",
    )

    monday = datetime.date(2026, 11, 23)
    timesheet = Timesheet.objects.create(
        employee=user,
        week_start_date=monday,
    )
    row = TimesheetRow.objects.create(timesheet=timesheet, project=project)

    for i in range(6):
        work_day = monday + datetime.timedelta(days=i)
        TimesheetEntry.objects.create(
            row=row, date=work_day, hours=Decimal("10.00"), note=f"Day {i}"
        )

    sunday = monday + datetime.timedelta(days=6)
    TimesheetEntry.objects.create(
        row=row, date=sunday, hours=Decimal("6.00"), note="Emergency commissioning"
    )

    data = get_own_timesheet(user=user, week_str="2026-11-23")

    policy = TimesheetPolicy.get_current()
    assert float(policy.daily_regular_hours) == 8.00

    monday_str = monday.isoformat()
    assert data["day_totals"][monday_str] == "10.00"
    assert data["day_regular"][monday_str] == "8.00"
    assert data["day_overtime"][monday_str] == "2.00"

    sunday_str = sunday.isoformat()
    assert data["day_totals"][sunday_str] == "6.00"
    assert data["day_regular"][sunday_str] == "0.00"
    assert data["day_overtime"][sunday_str] == "6.00"

    assert data["total_week_hours"] == "66.00"
    assert data["total_regular_hours"] == "48.00"
    assert data["total_overtime_hours"] == "18.00"
