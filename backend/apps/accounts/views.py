import secrets
import time

from django.conf import settings
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
    evaluate_login_security,
    get_device_id_from_request,
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
        device_id = get_device_id_from_request(request) or secrets.token_hex(16)
        resp = Response({"csrfToken": get_token(request)}, status=status.HTTP_200_OK)
        resp.set_cookie(
            "sys_dev_id",
            device_id,
            max_age=31536000,
            httponly=True,
            samesite="Lax",
            secure=getattr(settings, "SESSION_COOKIE_SECURE", False),
        )
        return resp


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data["identifier"]
        password = serializer.validated_data["password"]
        incoming_dev_id = serializer.validated_data.get("device_id") or get_device_id_from_request(
            request
        )
        company_tax_id = serializer.validated_data.get("company_tax_id", "")
        ip_address = get_client_ip(request)

        eval_result = evaluate_login_security(
            identifier=identifier,
            ip_address=ip_address,
            device_id=incoming_dev_id,
            honeypot_value=company_tax_id,
        )

        device_id = incoming_dev_id or secrets.token_hex(16)

        if eval_result["action"] == "reject_bot":
            record_login_attempt(
                identifier,
                ip_address,
                successful=False,
                device_id=device_id,
                failure_reason=eval_result.get("reason", "HONEYPOT_TRIGGERED"),
            )
            audit_services.record(
                action="BOT_REJECTED",
                entity_type="User",
                entity_id=identifier,
                summary=f"Automated submission rejected for identifier: {identifier} from IP {ip_address}",
                request=request,
            )
            resp = Response(
                {
                    "code": "authentication_failed",
                    "message": "Invalid credentials.",
                    "fields": {},
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
            resp.set_cookie(
                "sys_dev_id",
                device_id,
                max_age=31536000,
                httponly=True,
                samesite="Lax",
                secure=getattr(settings, "SESSION_COOKIE_SECURE", False),
            )
            return resp

        if eval_result["action"] == "lockout":
            audit_services.record(
                action="LOGIN_LOCKOUT",
                entity_type="User",
                entity_id=identifier,
                summary=f"Login locked out for identifier: {identifier} from IP {ip_address} on device {device_id}",
                request=request,
            )
            resp = Response(
                {
                    "code": "account_locked",
                    "message": eval_result["message"],
                    "fields": {},
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
            resp["Retry-After"] = str(eval_result.get("retry_after", 120))
            resp.set_cookie(
                "sys_dev_id",
                device_id,
                max_age=31536000,
                httponly=True,
                samesite="Lax",
                secure=getattr(settings, "SESSION_COOKIE_SECURE", False),
            )
            return resp

        if eval_result["action"] == "tarpit":
            tarpit_duration = eval_result.get("tarpit", 2.0)
            if tarpit_duration > 0:
                time.sleep(tarpit_duration)

        try:
            principal = authenticate_principal(identifier, password)
        except AuthenticationFailed:
            record_login_attempt(
                identifier,
                ip_address,
                successful=False,
                device_id=device_id,
                failure_reason="INVALID_CREDENTIALS",
            )
            audit_services.record(
                action="LOGIN_FAILURE",
                entity_type="User",
                entity_id=identifier,
                summary=f"Failed login attempt for identifier: {identifier}",
                request=request,
            )
            raise

        record_login_attempt(
            identifier,
            ip_address,
            successful=True,
            device_id=device_id,
        )
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
            resp = Response(data, status=status.HTTP_200_OK)
            resp.set_cookie(
                "sys_dev_id",
                device_id,
                max_age=31536000,
                httponly=True,
                samesite="Lax",
                secure=getattr(settings, "SESSION_COOKIE_SECURE", False),
            )
            return resp

        login(request, principal)
        request.session.modified = True
        data = UserMeSerializer(principal).data
        resp = Response(data, status=status.HTTP_200_OK)
        resp.set_cookie(
            "sys_dev_id",
            device_id,
            max_age=31536000,
            httponly=True,
            samesite="Lax",
            secure=getattr(settings, "SESSION_COOKIE_SECURE", False),
        )
        return resp


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
