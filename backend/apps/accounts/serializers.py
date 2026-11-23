from rest_framework import serializers
from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal

class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True, allow_blank=False)
    password = serializers.CharField(required=True, allow_blank=False, write_only=True)

class UserMeSerializer(serializers.ModelSerializer):
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
            "must_change_password",
        ]
        read_only_fields = fields

class SuperAdminMeSerializer(serializers.Serializer):
    id = serializers.CharField()
    employee_code = serializers.CharField()
    email = serializers.CharField()
    full_name = serializers.CharField()
    role = serializers.CharField()
    must_change_password = serializers.BooleanField()
