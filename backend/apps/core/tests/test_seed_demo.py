import pytest
from django.core.management import call_command
from apps.accounts.models import User, UserRole
from apps.projects.models import Project, ProjectAssignment
from apps.timesheets.models import Timesheet, TimesheetEntry, TimesheetWeekStatus

@pytest.mark.django_db
def test_seed_demo_command():
    call_command("seed_demo")

    assert User.objects.filter(role=UserRole.ADMIN).count() >= 4
    assert User.objects.filter(role=UserRole.EMPLOYEE).count() >= 60
    assert Project.objects.count() >= 12
    assert ProjectAssignment.objects.exists()

    assert Timesheet.objects.filter(status=TimesheetWeekStatus.APPROVED).exists()
    assert Timesheet.objects.filter(status=TimesheetWeekStatus.SUBMITTED).exists()
    assert Timesheet.objects.filter(status=TimesheetWeekStatus.OPEN).exists()

    assert TimesheetEntry.objects.count() > 100
