from rest_framework import serializers
from apps.telemetry.models import ErrorLog, RequestLog

class RequestLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestLog
        fields = [
            "id",
            "method",
            "route_template",
            "path",
            "status_code",
            "duration_ms",
            "actor_label",
            "ip_address",
            "response_size_bytes",
            "request_id",
            "created_at",
        ]

class ErrorLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ErrorLog
        fields = [
            "id",
            "error_class",
            "message",
            "trace",
            "request_id",
            "path",
            "method",
            "actor_label",
            "created_at",
        ]
