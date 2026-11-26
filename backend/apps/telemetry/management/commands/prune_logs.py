from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import LoginAttempt
from apps.audit.models import AuditLog
from apps.telemetry.models import ErrorLog, RequestLog


class Command(BaseCommand):
    help = "Prune expired audit, telemetry and authentication logs based on retention policies"

    def add_arguments(self, parser):
        parser.add_argument("--audit-days", type=int, default=None)
        parser.add_argument("--request-days", type=int, default=None)
        parser.add_argument("--error-days", type=int, default=None)
        parser.add_argument("--login-attempt-days", type=int, default=None)
        parser.add_argument("--dry-run", action="store_true", default=False)

    def handle(self, *args, **options):
        retention = getattr(settings, "LOG_RETENTION_DAYS", {})
        audit_days = options.get("audit_days") or retention.get("audit", 365)
        request_days = options.get("request_days") or retention.get("requests", 30)
        error_days = options.get("error_days") or retention.get("errors", 90)
        attempt_days = options.get("login_attempt_days") or retention.get("login_attempts", 30)
        dry_run = options.get("dry_run", False)

        now = timezone.now()

        req_cutoff = now - timedelta(days=request_days)
        err_cutoff = now - timedelta(days=error_days)
        aud_cutoff = now - timedelta(days=audit_days)
        att_cutoff = now - timedelta(days=attempt_days)

        req_qs = RequestLog.objects.filter(created_at__lt=req_cutoff)
        err_qs = ErrorLog.objects.filter(created_at__lt=err_cutoff)
        aud_qs = AuditLog.objects.filter(created_at__lt=aud_cutoff)
        att_qs = LoginAttempt.objects.filter(attempted_at__lt=att_cutoff)

        req_count = req_qs.count()
        err_count = err_qs.count()
        aud_count = aud_qs.count()
        att_count = att_qs.count()

        if dry_run:
            self.stdout.write(f"[Dry Run] Would prune {req_count} request logs (>{request_days}d)")
            self.stdout.write(f"[Dry Run] Would prune {err_count} error logs (>{error_days}d)")
            self.stdout.write(f"[Dry Run] Would prune {aud_count} audit logs (>{audit_days}d)")
            self.stdout.write(
                f"[Dry Run] Would prune {att_count} login attempts (>{attempt_days}d)"
            )
            return

        req_deleted, _ = req_qs.delete()
        err_deleted, _ = err_qs.delete()
        aud_deleted, _ = aud_qs.delete()
        att_deleted, _ = att_qs.delete()

        self.stdout.write(f"Pruned {req_deleted} request logs (>{request_days}d)")
        self.stdout.write(f"Pruned {err_deleted} error logs (>{error_days}d)")
        self.stdout.write(f"Pruned {aud_deleted} audit logs (>{audit_days}d)")
        self.stdout.write(f"Pruned {att_deleted} login attempts (>{attempt_days}d)")
