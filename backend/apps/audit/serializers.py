from rest_framework import serializers
from apps.audit.models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    actor_user = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor_kind",
            "actor_label",
            "actor_user",
            "action",
            "entity_type",
            "entity_id",
            "summary",
            "changes",
            "ip_address",
            "user_agent",
            "request_id",
            "super_only",
            "created_at",
        ]

    def get_actor_user(self, obj):
        if obj.actor_user:
            return {
                "id": obj.actor_user.id,
                "code": obj.actor_user.employee_code,
                "name": obj.actor_user.full_name,
            }
        return None
