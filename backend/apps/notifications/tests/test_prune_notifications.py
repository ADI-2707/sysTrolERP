import datetime
from io import StringIO

import pytest
import time_machine
from django.core.management import call_command
from django.utils import timezone

from apps.accounts.models import User, UserRole
from apps.notifications.models import Notification
from apps.notifications.services import prune_old_notifications


@pytest.mark.django_db
def test_prune_read_and_unread_notifications():
    user = User.objects.create_user(
        employee_code="PRN-001",
        email="prune@example.com",
        full_name="Prune Test",
        role=UserRole.EMPLOYEE,
        password="Password123!",
    )

    base_time = datetime.datetime(2026, 11, 25, 12, 0, tzinfo=datetime.timezone.utc)

    with time_machine.travel(base_time - datetime.timedelta(days=70)):
        old_read = Notification.objects.create(
            recipient=user,
            event_type="TEST",
            title="Old Read",
            body="Old Read Body",
            is_read=True,
            read_at=timezone.now(),
        )

    with time_machine.travel(base_time - datetime.timedelta(days=200)):
        old_unread = Notification.objects.create(
            recipient=user,
            event_type="TEST",
            title="Old Unread",
            body="Old Unread Body",
            is_read=False,
        )

    with time_machine.travel(base_time - datetime.timedelta(days=10)):
        recent_read = Notification.objects.create(
            recipient=user,
            event_type="TEST",
            title="Recent Read",
            body="Recent Read Body",
            is_read=True,
            read_at=timezone.now(),
        )

    with time_machine.travel(base_time - datetime.timedelta(days=2)):
        recent_unread = Notification.objects.create(
            recipient=user,
            event_type="TEST",
            title="Recent Unread",
            body="Recent Unread Body",
            is_read=False,
        )

    with time_machine.travel(base_time):
        res = prune_old_notifications(read_days=60, unread_days=180, dry_run=False)
        assert res["pruned_read"] == 1
        assert res["pruned_unread"] == 1
        assert res["total"] == 2

        assert not Notification.objects.filter(id=old_read.id).exists()
        assert not Notification.objects.filter(id=old_unread.id).exists()
        assert Notification.objects.filter(id=recent_read.id).exists()
        assert Notification.objects.filter(id=recent_unread.id).exists()


@pytest.mark.django_db
def test_prune_dry_run_and_management_command():
    user = User.objects.create_user(
        employee_code="PRN-002",
        email="prune2@example.com",
        full_name="Prune Test Two",
        role=UserRole.EMPLOYEE,
        password="Password123!",
    )

    base_time = datetime.datetime(2026, 11, 25, 12, 0, tzinfo=datetime.timezone.utc)

    with time_machine.travel(base_time - datetime.timedelta(days=70)):
        old_read = Notification.objects.create(
            recipient=user,
            event_type="TEST",
            title="Old Read",
            body="Old Read Body",
            is_read=True,
            read_at=timezone.now(),
        )

    with time_machine.travel(base_time):
        dry_res = prune_old_notifications(read_days=60, dry_run=True)
        assert dry_res["total"] == 1
        assert Notification.objects.filter(id=old_read.id).exists()

        out = StringIO()
        call_command("prune_notifications", "--days=60", stdout=out)
        output = out.getvalue()
        assert "Pruned 1 notifications" in output
        assert not Notification.objects.filter(id=old_read.id).exists()
