import pytest
from django.core.management import call_command

from apps.accounts.models import User
from apps.projects.models import Project
from apps.timesheets.models import Timesheet, TimesheetPolicy


@pytest.mark.django_db
def test_clean_slate_seed_command():
    call_command("seed_demo", clear=True)

    assert User.objects.count() == 0
    assert Project.objects.count() == 0
    assert Timesheet.objects.count() == 0
    assert TimesheetPolicy.objects.exists()
