import pytest

from apps.audit.models import ActorKind, AuditLog


@pytest.mark.django_db
def test_audit_log_append_only():
    log = AuditLog.objects.create(
        actor_kind=ActorKind.ADMIN,
        actor_label="SYS-0001",
        action="USER_UPDATE",
        entity_type="User",
        entity_id="42",
        summary="Updated user profile",
        changes={"designation": ["Engineer", "Lead Engineer"]},
    )
    assert log.pk is not None

    with pytest.raises(RuntimeError, match="AuditLog records are append-only"):
        log.summary = "Attempted edit"
        log.save()

    with pytest.raises(RuntimeError, match="AuditLog records cannot be individually deleted"):
        log.delete()
