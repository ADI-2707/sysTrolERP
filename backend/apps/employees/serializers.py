from rest_framework import serializers

from apps.accounts.models import User, UserRole


class EmployeeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "employee_code",
            "email",
            "full_name",
            "phone",
            "designation",
            "department",
            "role",
            "is_active",
            "must_change_password",
            "revoked_at",
            "date_joined",
            "last_login",
        ]
        read_only_fields = fields


class EmployeeCreateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    full_name = serializers.CharField(max_length=150, required=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True, default="")
    designation = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default=""
    )
    department = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    role = serializers.ChoiceField(choices=UserRole.choices, default=UserRole.EMPLOYEE)


class EmployeeUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    full_name = serializers.CharField(max_length=150, required=False)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    designation = serializers.CharField(max_length=100, required=False, allow_blank=True)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)


class ReasonSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, allow_blank=False, min_length=1)


class EmployeeCreatedResponseSerializer(serializers.ModelSerializer):
    temporary_password = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "employee_code",
            "email",
            "full_name",
            "phone",
            "designation",
            "department",
            "role",
            "temporary_password",
            "must_change_password",
            "date_joined",
        ]


class EmployeeDetailSerializer(serializers.ModelSerializer):
    assigned_projects = serializers.SerializerMethodField()
    recent_activity = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "employee_code",
            "email",
            "full_name",
            "phone",
            "designation",
            "department",
            "role",
            "is_active",
            "must_change_password",
            "revoked_at",
            "revoked_by",
            "date_joined",
            "last_login",
            "assigned_projects",
            "recent_activity",
        ]
        read_only_fields = fields

    def get_assigned_projects(self, obj):
        if hasattr(obj, "project_assignments"):
            return [
                {
                    "project_id": a.project.id,
                    "code": a.project.code,
                    "name": a.project.name,
                }
                for a in obj.project_assignments.select_related("project").all()
            ]
        return []

    def get_recent_activity(self, obj):
        from apps.audit.models import AuditLog

        logs = AuditLog.objects.filter(actor_user=obj).order_by("-created_at")[:10]
        return [
            {
                "id": log.id,
                "action": log.action,
                "summary": log.summary,
                "created_at": log.created_at,
            }
            for log in logs
        ]
