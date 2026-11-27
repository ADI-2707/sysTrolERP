from django.urls import path

from apps.notifications.views import (
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    UnreadNotificationCountView,
)

urlpatterns = [
    path("unread-count/", UnreadNotificationCountView.as_view(), name="notification-unread-count"),
    path("", NotificationListView.as_view(), name="notification-list"),
    path("<int:pk>/mark-read/", NotificationMarkReadView.as_view(), name="notification-mark-read"),
    path(
        "mark-all-read/", NotificationMarkAllReadView.as_view(), name="notification-mark-all-read"
    ),
]
