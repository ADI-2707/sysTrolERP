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
    designation = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    department = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    role = serializers.ChoiceField(choices=UserRole.choices, default=UserRole.EMPLOYEE)

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
