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
