from django.core.management.base import BaseCommand

from apps.timesheets.services import close_expired_weeks


class Command(BaseCommand):
    help = "Close expired open timesheet weeks and mark them submitted"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulate closing without saving changes",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        count = close_expired_weeks(dry_run=dry_run)
        mode = "DRY RUN: would close" if dry_run else "Closed"
        self.stdout.write(self.style.SUCCESS(f"{mode} {count} expired open timesheets."))
