from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "actor_label",
            "event_type",
            "category",
            "priority",
            "title",
            "body",
            "action_url",
            "is_read",
            "read_at",
            "metadata",
            "created_at",
        ]
        read_only_fields = fields
