from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import permissions, status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.principals import SuperAdminPrincipal
from apps.accounts.serializers import LoginSerializer, SuperAdminMeSerializer, UserMeSerializer
from apps.accounts.services import (
    authenticate_principal,
    is_login_locked,
    record_login_attempt,
)
from apps.audit import services as audit_services

def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "127.0.0.1")

class CsrfCookieView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({"csrfToken": get_token(request)}, status=status.HTTP_200_OK)

class LoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data["identifier"]
        password = serializer.validated_data["password"]
        ip_address = get_client_ip(request)

        if is_login_locked(identifier, ip_address):
            audit_services.record(
                action="LOGIN_LOCKOUT",
                entity_type="User",
                entity_id=identifier,
                summary=f"Login locked out for identifier: {identifier} from IP {ip_address}",
                request=request,
            )
            return Response(
                {
                    "code": "account_locked",
                    "message": "Too many failed login attempts. Account is temporarily locked for 15 minutes.",
                    "fields": {},
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            principal = authenticate_principal(identifier, password)
        except AuthenticationFailed:
            record_login_attempt(identifier, ip_address, successful=False)
            audit_services.record(
                action="LOGIN_FAILURE",
                entity_type="User",
                entity_id=identifier,
                summary=f"Failed login attempt for identifier: {identifier}",
                request=request,
            )
            raise

        record_login_attempt(identifier, ip_address, successful=True)
        entity_id = str(getattr(principal, "id", None) or getattr(principal, "username", ""))
        audit_services.record(
            action="LOGIN_SUCCESS",
            actor=principal,
            entity_type="User",
            entity_id=entity_id,
            summary=f"Principal {principal} logged in successfully.",
            request=request,
        )

        if isinstance(principal, SuperAdminPrincipal):
            request.session.flush()
            request.session["is_super_admin"] = True
            request.session["super_admin_username"] = principal.username
            request.session.modified = True
            data = SuperAdminMeSerializer(principal).data
            return Response(data, status=status.HTTP_200_OK)

        login(request, principal)
        request.session.modified = True
        data = UserMeSerializer(principal).data
        return Response(data, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        audit_services.record(
            action="LOGOUT",
            actor=request.user,
            entity_type="User",
            entity_id=str(getattr(request.user, "id", getattr(request.user, "username", ""))),
            summary=f"User {request.user} logged out.",
            request=request,
        )
        logout(request)
        if hasattr(request, "session"):
            request.session.flush()
        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        principal = request.user
        if isinstance(principal, SuperAdminPrincipal):
            data = SuperAdminMeSerializer(principal).data
            return Response(data, status=status.HTTP_200_OK)
        data = UserMeSerializer(principal).data
        return Response(data, status=status.HTTP_200_OK)
