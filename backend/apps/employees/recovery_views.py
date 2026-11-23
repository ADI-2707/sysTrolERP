from rest_framework import serializers, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.models import User
from apps.accounts.permissions import IsSuper
from apps.accounts.services import clear_login_lockout
from apps.audit import services as audit_services
from apps.employees.selectors import get_employee_by_id
from apps.employees.services import generate_temporary_password, restore_employee, terminate_user_sessions

class SuperResetAdminPasswordSerializer(serializers.Serializer):
    employee_id = serializers.IntegerField(required=True)

class SuperRestoreAccountSerializer(serializers.Serializer):
    employee_id = serializers.IntegerField(required=True)
    reason = serializers.CharField(required=True, allow_blank=False, min_length=1)

class SuperClearLockoutSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True, allow_blank=False)
    ip_address = serializers.IPAddressField(required=False, allow_null=True)

class SuperResetAdminPasswordView(APIView):
    permission_classes = [IsSuper]

    def post(self, request):
        serializer = SuperResetAdminPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = get_employee_by_id(serializer.validated_data["employee_id"])
        if user is None:
            raise NotFound("Employee not found.")

        temp_password = generate_temporary_password()
        user.set_password(temp_password)
        user.must_change_password = True
        user.save(update_fields=["password", "must_change_password"])

        terminate_user_sessions(user)

        audit_services.record(
            action="SUPER_ADMIN_PASSWORD_RESET",
            actor=request.user,
            entity_type="User",
            entity_id=str(user.id),
            summary=f"Super admin reset password for {user.employee_code} ({user.email})",
            request=request,
            super_only=True,
        )

        return Response(
            {
                "temporary_password": temp_password,
                "message": "Admin password reset successfully.",
            },
            status=status.HTTP_200_OK,
        )

class SuperRestoreAccountView(APIView):
    permission_classes = [IsSuper]

    def post(self, request):
        serializer = SuperRestoreAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = get_employee_by_id(serializer.validated_data["employee_id"])
        if user is None:
            raise NotFound("Employee not found.")

        restore_employee(
            user=user,
            actor=request.user,
            reason=serializer.validated_data["reason"],
            request=request,
        )

        return Response({"message": "Account restored successfully."}, status=status.HTTP_200_OK)

class SuperClearLockoutView(APIView):
    permission_classes = [IsSuper]

    def post(self, request):
        serializer = SuperClearLockoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data["identifier"]
        ip_address = serializer.validated_data.get("ip_address")

        clear_login_lockout(identifier, ip_address)

        audit_services.record(
            action="SUPER_CLEAR_LOCKOUT",
            actor=request.user,
            entity_type="Lockout",
            entity_id=identifier,
            summary=f"Super admin cleared login lockout for {identifier} (IP: {ip_address or 'all'})",
            request=request,
            super_only=True,
        )

        return Response({"message": "Login lockout cleared successfully."}, status=status.HTTP_200_OK)
