import io
from datetime import timedelta

import pytest
from django.core.management import call_command
from django.utils import timezone

from apps.accounts.models import LoginAttempt
from apps.telemetry.models import RequestLog


@pytest.mark.django_db
def test_prune_logs_command():
    now = timezone.now()
    old_time = now - timedelta(days=40)
    recent_time = now - timedelta(days=2)

    old_req = RequestLog.objects.create(
        method="GET",
        path="/api/old",
        status_code=200,
        duration_ms=12.5,
        created_at=old_time,
    )
    RequestLog.objects.filter(id=old_req.id).update(created_at=old_time)

    new_req = RequestLog.objects.create(
        method="GET",
        path="/api/new",
        status_code=200,
        duration_ms=10.0,
        created_at=recent_time,
    )

    old_att = LoginAttempt.objects.create(
        identifier="old@example.com",
        ip_address="1.1.1.1",
        attempted_at=old_time,
    )
    LoginAttempt.objects.filter(id=old_att.id).update(attempted_at=old_time)

    out = io.StringIO()
    call_command("prune_logs", request_days=30, login_attempt_days=30, stdout=out)

    assert not RequestLog.objects.filter(id=old_req.id).exists()
    assert RequestLog.objects.filter(id=new_req.id).exists()
    assert not LoginAttempt.objects.filter(id=old_att.id).exists()
