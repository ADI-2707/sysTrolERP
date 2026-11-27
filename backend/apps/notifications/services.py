from typing import Any

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
