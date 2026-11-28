from django.core.management.base import BaseCommand

from apps.notifications.services import prune_old_notifications


class Command(BaseCommand):
    help = "Prune expired or excess in-app notifications according to retention policy"

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=14,
            help="Prune read notifications older than this many days (default 14)",
        )
        parser.add_argument(
            "--unread-days",
            type=int,
            default=30,
            help="Prune unread notifications older than this many days (default 30)",
        )
        parser.add_argument(
            "--max-per-user",
            type=int,
            default=50,
            help="Maximum allowed notifications per user (default 50)",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=1000,
            help="Batch size for database chunk deletions (default 1000)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulate pruning without deleting records",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        summary = prune_old_notifications(
            read_days=options["days"],
            unread_days=options["unread_days"],
            max_per_user=options["max_per_user"],
            batch_size=options["batch_size"],
            dry_run=dry_run,
        )
        mode = "DRY RUN: would prune" if dry_run else "Pruned"
        self.stdout.write(
            self.style.SUCCESS(
                f"{mode} {summary['total']} notifications "
                f"({summary['pruned_read']} read, "
                f"{summary['pruned_unread']} unread, "
                f"{summary['pruned_excess']} excess)."
            )
        )
