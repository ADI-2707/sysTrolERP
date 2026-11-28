import datetime
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.projects.models import Project
from apps.timesheets.models import Timesheet, TimesheetEntry, TimesheetRow


@pytest.mark.django_db
def test_site_diary_pdf_and_excel_export_success():
    emp = User.objects.create_user(
        email="onsite_lead@example.com",
        employee_code="SYS-0401",
        full_name="Onsite Lead",
        password="Password123!",
        designation="Lead Commissioning Engineer",
    )
    project = Project.objects.create(
        code="PRJ-OMN-2026",
        name="Oman Gas Compressor Plant",
        slug="prj-omn-2026",
        client_name="Oman Gas Co",
        site_country="Oman",
        site_city_or_plant="Sohar Port",
        site_timezone="Asia/Muscat",
    )

    monday = datetime.date(2026, 11, 23)
    timesheet = Timesheet.objects.create(
        employee=emp,
        week_start_date=monday,
    )
    row = TimesheetRow.objects.create(timesheet=timesheet, project=project)

    TimesheetEntry.objects.create(
        row=row,
        date=monday,
        hours=Decimal("11.50"),
        note="Pre-commissioning sensor loop check with client in-charge",
    )

    client = APIClient()
    client.force_authenticate(user=emp)

    url_pdf = f"/api/timesheets/{timesheet.id}/site-diary/?project_id={project.id}&format=pdf"
    res_pdf = client.get(url_pdf)
    assert res_pdf.status_code == 200
    assert res_pdf["Content-Type"] == "application/pdf"
    assert "attachment;" in res_pdf["Content-Disposition"]
    assert "Site_Diary_PRJ-OMN-2026_SYS-0401_20261123.pdf" in res_pdf["Content-Disposition"]
    assert res_pdf.content.startswith(b"%PDF-")

    url_excel = f"/api/timesheets/{timesheet.id}/site-diary/?project_id={project.id}&format=excel"
    res_excel = client.get(url_excel)
    assert res_excel.status_code == 200
    assert (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        in res_excel["Content-Type"]
    )
    assert "Site_Diary_PRJ-OMN-2026_SYS-0401_20261123.xlsx" in res_excel["Content-Disposition"]
    assert res_excel.content.startswith(b"PK\x03\x04")


@pytest.mark.django_db
def test_site_diary_strict_project_isolation():
    emp = User.objects.create_user(
        email="multi_lead@example.com",
        employee_code="SYS-0402",
        full_name="Multi Lead",
        password="Password123!",
    )
    prj_a = Project.objects.create(
        code="PRJ-A",
        name="Project A",
        slug="prj-a",
        client_name="Client Alpha",
    )
    prj_b = Project.objects.create(
        code="PRJ-B",
        name="Project B",
        slug="prj-b",
        client_name="Client Beta",
    )
    prj_c = Project.objects.create(
        code="PRJ-C",
        name="Project C",
        slug="prj-c",
        client_name="Client Gamma",
    )

    monday = datetime.date(2026, 11, 23)
    timesheet = Timesheet.objects.create(employee=emp, week_start_date=monday)
    row_a = TimesheetRow.objects.create(timesheet=timesheet, project=prj_a)
    TimesheetEntry.objects.create(
        row=row_a, date=monday, hours=Decimal("8.00"), note="Work for Alpha only"
    )

    client = APIClient()
    client.force_authenticate(user=emp)

    res_a = client.get(
        f"/api/timesheets/{timesheet.id}/site-diary/?project_id={prj_a.id}&format=pdf"
    )
    assert res_a.status_code == 200

    res_c_unrelated = client.get(
        f"/api/timesheets/{timesheet.id}/site-diary/?project_id={prj_c.id}&format=pdf"
    )
    assert res_c_unrelated.status_code == 400
    assert "No recorded entries" in res_c_unrelated.json()["fields"]["project_id"][0]


@pytest.mark.django_db
def test_site_diary_permission_isolation_and_admin_access():
    emp_owner = User.objects.create_user(
        email="owner@example.com",
        employee_code="SYS-0403",
        full_name="Owner User",
        password="Password123!",
    )
    emp_intruder = User.objects.create_user(
        email="intruder@example.com",
        employee_code="SYS-0404",
        full_name="Intruder User",
        password="Password123!",
    )
    admin_user = User.objects.create_user(
        email="admin@example.com",
        employee_code="SYS-0405",
        full_name="Admin User",
        role="ADMIN",
        password="Password123!",
    )
    project = Project.objects.create(code="PRJ-SEC", name="Security Prj", slug="prj-sec")

    monday = datetime.date(2026, 11, 23)
    timesheet = Timesheet.objects.create(employee=emp_owner, week_start_date=monday)
    row = TimesheetRow.objects.create(timesheet=timesheet, project=project)
    TimesheetEntry.objects.create(row=row, date=monday, hours=Decimal("8.00"))

    intruder_client = APIClient()
    intruder_client.force_authenticate(user=emp_intruder)
    res_forbidden = intruder_client.get(
        f"/api/timesheets/{timesheet.id}/site-diary/?project_id={project.id}"
    )
    assert res_forbidden.status_code == 403

    admin_client = APIClient()
    admin_client.force_authenticate(user=admin_user)
    res_admin = admin_client.get(
        f"/api/timesheets/{timesheet.id}/site-diary/?project_id={project.id}"
    )
    assert res_admin.status_code == 200
    assert res_admin.content.startswith(b"%PDF-")
