from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import EmployeeCodeSequence, User
from apps.projects.models import Project, ProjectAssignment, ProjectCodeSequence, ProjectStep
from apps.timesheets.models import (
    Timesheet,
    TimesheetEntry,
    TimesheetPolicy,
    TimesheetRow,
)


class Command(BaseCommand):
    help = "Initializes a clean slate baseline for sysTrol ERP with zero projects, employees, or timesheets."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear all existing entities to ensure a completely clean slate.",
        )

    def handle(self, *args, **options):
        self.stdout.write("Initializing clean slate ERP baseline...")

        with transaction.atomic():
            TimesheetEntry.objects.all().delete()
            TimesheetRow.objects.all().delete()
            Timesheet.objects.all().delete()
            ProjectAssignment.objects.all().delete()
            ProjectStep.objects.all().delete()
            Project.objects.all().delete()
            User.objects.all().delete()
            ProjectCodeSequence.objects.all().delete()
            EmployeeCodeSequence.objects.filter(name="employee_code").update(last_number=0)

            TimesheetPolicy.get_current()

        self.stdout.write(
            self.style.SUCCESS(
                "Clean slate initialized successfully: 0 users, 0 projects, 0 timesheets. SuperAdmin ready."
            )
        )
