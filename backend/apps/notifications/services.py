import datetime
from typing import Any

from django.db.models import Count
from django.utils import timezone

from apps.accounts.models import User
from apps.notifications.models import (
    Notification,
    NotificationCategory,
    NotificationPriority,
)


def create_notification(
    *,
    recipient: User,
    actor: User | None = None,
    actor_label: str = "",
    event_type: str,
    title: str,
    body: str,
    category: str = NotificationCategory.SYSTEM,
    priority: str = NotificationPriority.NORMAL,
    action_url: str = "",
    metadata: dict[str, Any] | None = None,
) -> Notification:
    return Notification.objects.create(
        recipient=recipient,
        actor=actor,
        actor_label=actor_label,
        event_type=event_type,
        category=category,
        priority=priority,
        title=title,
        body=body,
        action_url=action_url,
        metadata=metadata or {},
    )


def bulk_create_notifications(records: list[dict[str, Any]]) -> list[Notification]:
    if not records:
        return []
    notifications = [
        Notification(
            recipient=r["recipient"],
            actor=r.get("actor"),
            actor_label=r.get("actor_label", ""),
            event_type=r["event_type"],
            category=r.get("category", NotificationCategory.SYSTEM),
            priority=r.get("priority", NotificationPriority.NORMAL),
            title=r["title"],
            body=r["body"],
            action_url=r.get("action_url", ""),
            metadata=r.get("metadata") or {},
        )
        for r in records
    ]
    return Notification.objects.bulk_create(notifications)


def prune_old_notifications(
    *,
    read_days: int = 14,
    unread_days: int = 30,
    max_per_user: int = 50,
    batch_size: int = 1000,
    dry_run: bool = False,
) -> dict[str, int]:
    now = timezone.now()
    read_cutoff = now - datetime.timedelta(days=read_days)
    unread_cutoff = now - datetime.timedelta(days=unread_days)

    read_pks = list(
        Notification.objects.filter(is_read=True, created_at__lt=read_cutoff).values_list(
            "id", flat=True
        )
    )
    unread_pks = list(
        Notification.objects.filter(is_read=False, created_at__lt=unread_cutoff).values_list(
            "id", flat=True
        )
    )

    all_base_pks = set(read_pks + unread_pks)
    excess_pks = []
    over_limit_users = (
        Notification.objects.exclude(id__in=all_base_pks)
        .values("recipient")
        .annotate(cnt=Count("id"))
        .filter(cnt__gt=max_per_user)
    )
    for entry in over_limit_users:
        user_id = entry["recipient"]
        user_excess = list(
            Notification.objects.filter(recipient_id=user_id)
            .exclude(id__in=all_base_pks)
            .order_by("-created_at")
            .values_list("id", flat=True)[max_per_user:]
        )
        excess_pks.extend(user_excess)

    all_to_delete = sorted(list(all_base_pks.union(excess_pks)))
    total_count = len(all_to_delete)

    if not dry_run and total_count > 0:
        for i in range(0, total_count, batch_size):
            chunk = all_to_delete[i : i + batch_size]
            Notification.objects.filter(id__in=chunk).delete()

    return {
        "pruned_read": len(read_pks),
        "pruned_unread": len(unread_pks),
        "pruned_excess": len(excess_pks),
        "total": total_count,
    }
