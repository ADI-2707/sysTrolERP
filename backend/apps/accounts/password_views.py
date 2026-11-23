from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.contrib.sessions.models import Session
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import permissions, serializers, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.principals import SuperAdminPrincipal

class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise ValidationError({"confirm_password": ["New passwords do not match."]})
        return attrs

class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if isinstance(request.user, SuperAdminPrincipal):
            raise PermissionDenied("Super admin password cannot be changed via UI. Use the management command.")

        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        current_password = serializer.validated_data["current_password"]
        new_password = serializer.validated_data["new_password"]

        user = request.user
        if not user.check_password(current_password):
            raise ValidationError({"current_password": ["Current password is incorrect."]})

        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            raise ValidationError({"new_password": list(exc.messages)})

        user.set_password(new_password)
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])

        current_key = getattr(request.session, "session_key", None)
        user_id_str = str(user.id)
        now = timezone.now()
        sessions_to_delete = []
        for s in Session.objects.filter(expire_date__gte=now):
            if current_key and s.session_key == current_key:
                continue
            try:
                if s.get_decoded().get("_auth_user_id") == user_id_str:
                    sessions_to_delete.append(s.session_key)
            except Exception:
                pass
        if sessions_to_delete:
            Session.objects.filter(session_key__in=sessions_to_delete).delete()

        update_session_auth_hash(request, user)

        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)
