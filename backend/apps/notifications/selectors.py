from typing import Any

from django.db.models import QuerySet

from apps.accounts.models import User
from apps.notifications.models import Notification


def get_unread_count(*, user: Any) -> int:
    if not isinstance(user, User):
        return 0
    return Notification.objects.filter(recipient=user, is_read=False).count()


def list_notifications(
    *,
    user: Any,
    is_read: bool | None = None,
    category: str | None = None,
) -> QuerySet[Notification]:
    if not isinstance(user, User):
        return Notification.objects.none()
    qs = Notification.objects.filter(recipient=user)
    if is_read is not None:
        qs = qs.filter(is_read=is_read)
    if category:
        qs = qs.filter(category=category)
    return qs.order_by("-created_at")
