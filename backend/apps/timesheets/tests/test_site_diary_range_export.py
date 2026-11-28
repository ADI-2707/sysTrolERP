import datetime
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.projects.models import Project
from apps.timesheets.models import (
    Timesheet,
    TimesheetEntry,
    TimesheetPolicy,
    TimesheetRow,
    TimesheetWeekStatus,
)


@pytest.fixture
def range_export_fixture(db):
    TimesheetPolicy.objects.all().delete()
    TimesheetPolicy.objects.create(
        daily_regular_hours=Decimal("8.00"),
        overtime_threshold_daily=Decimal("8.00"),
        hour_step=Decimal("0.25"),
        break_duration_hours=Decimal("1.00"),
    )

    engineer = User.objects.create_user(
        email="onsite_engineer_range@example.com",
        employee_code="SYS-RNG-01",
        full_name="Range Commissioning Engineer",
        password="Password123!",
        role="EMPLOYEE",
        designation="Lead Commissioning Specialist",
    )

    admin_user = User.objects.create_user(
        email="admin_range@example.com",
        employee_code="SYS-ADM-01",
        full_name="Admin Supervisor",
        password="Password123!",
        role="ADMIN",
    )

    project = Project.objects.create(
        code="PRJ-EUR-2026",
        name="European Robotics Cell",
        slug="prj-eur-2026",
        client_name="EuroTech Automation",
        site_country="Germany",
        site_city_or_plant="Stuttgart Plant 4",
        site_timezone="Europe/Berlin",
    )

    monday_w1 = datetime.date(2026, 10, 12)
    ts_w1 = Timesheet.objects.create(
        employee=engineer,
        week_start_date=monday_w1,
        status=TimesheetWeekStatus.OPEN,
    )
    row_w1 = TimesheetRow.objects.create(timesheet=ts_w1, project=project)
    TimesheetEntry.objects.create(
        row=row_w1,
        date=datetime.date(2026, 10, 14),
        hours=Decimal("10.00"),
        note="Robot welding trajectory calibration",
    )
    TimesheetEntry.objects.create(
        row=row_w1,
        date=datetime.date(2026, 10, 18),
        hours=Decimal("5.00"),
        note="Sunday safety circuit validation",
    )

    monday_w2 = datetime.date(2026, 10, 19)
    ts_w2 = Timesheet.objects.create(
        employee=engineer,
        week_start_date=monday_w2,
        status=TimesheetWeekStatus.OPEN,
    )
    row_w2 = TimesheetRow.objects.create(timesheet=ts_w2, project=project)
    TimesheetEntry.objects.create(
        row=row_w2,
        date=datetime.date(2026, 10, 20),
        hours=Decimal("8.00"),
        note="Final cycle time trial and MOM review",
    )

    return {
        "engineer": engineer,
        "admin": admin_user,
        "project": project,
    }


@pytest.mark.django_db
def test_date_range_site_diary_pdf_and_excel_export_success(range_export_fixture):
    engineer = range_export_fixture["engineer"]
    project = range_export_fixture["project"]

    client = APIClient()
    client.force_authenticate(user=engineer)

    url_pdf = (
        f"/api/timesheets/site-diary/?project_id={project.id}"
        "&start_date=2026-10-14&end_date=2026-10-22&format=pdf"
    )
    res_pdf = client.get(url_pdf)
    assert res_pdf.status_code == 200
    assert res_pdf["Content-Type"] == "application/pdf"
    assert "attachment;" in res_pdf["Content-Disposition"]
    assert (
        "Site_Diary_PRJ-EUR-2026_SYS-RNG-01_20261014_20261022.pdf" in res_pdf["Content-Disposition"]
    )
    assert res_pdf.content.startswith(b"%PDF-")

    url_excel = (
        f"/api/timesheets/site-diary/?project_id={project.id}"
        "&start_date=2026-10-14&end_date=2026-10-22&format=excel"
    )
    res_excel = client.get(url_excel)
    assert res_excel.status_code == 200
    assert (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        in res_excel["Content-Type"]
    )
    assert (
        "Site_Diary_PRJ-EUR-2026_SYS-RNG-01_20261014_20261022.xlsx"
        in res_excel["Content-Disposition"]
    )
    assert res_excel.content.startswith(b"PK\x03\x04")


@pytest.mark.django_db
def test_date_range_export_validation_errors(range_export_fixture):
    engineer = range_export_fixture["engineer"]
    project = range_export_fixture["project"]

    client = APIClient()
    client.force_authenticate(user=engineer)

    res1 = client.get(f"/api/timesheets/site-diary/?project_id={project.id}&start_date=2026-10-14")
    assert res1.status_code == 400

    res2 = client.get(
        f"/api/timesheets/site-diary/?project_id={project.id}&start_date=2026-10-25&end_date=2026-10-14"
    )
    assert res2.status_code == 400

    res3 = client.get(
        f"/api/timesheets/site-diary/?project_id={project.id}&start_date=2026-11-01&end_date=2026-11-05"
    )
    assert res3.status_code == 400


@pytest.mark.django_db
def test_admin_can_export_employee_site_diary_range(range_export_fixture):
    admin = range_export_fixture["admin"]
    engineer = range_export_fixture["engineer"]
    project = range_export_fixture["project"]

    client = APIClient()
    client.force_authenticate(user=admin)

    url = (
        f"/api/timesheets/site-diary/?project_id={project.id}"
        f"&employee_id={engineer.id}"
        "&start_date=2026-10-14&end_date=2026-10-22&format=pdf"
    )
    res = client.get(url)
    assert res.status_code == 200
    assert res["Content-Type"] == "application/pdf"
    assert "Site_Diary_PRJ-EUR-2026_SYS-RNG-01_20261014_20261022.pdf" in res["Content-Disposition"]
