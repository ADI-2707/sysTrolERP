from django.db.models import Q, QuerySet
from rest_framework.exceptions import PermissionDenied
from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal
from apps.telemetry.models import ErrorLog, RequestLog

def check_telemetry_access(user: User | SuperAdminPrincipal) -> None:
    is_super = isinstance(user, SuperAdminPrincipal) or getattr(user, "role", None) == "SUPER"
    is_admin = isinstance(user, User) and getattr(user, "role", None) == "ADMIN"
    if not (is_super or is_admin):
        raise PermissionDenied("Access to telemetry logs is restricted to administrators.")

def query_request_logs(
    user: User | SuperAdminPrincipal,
    *,
    status_code: str = "",
    method: str = "",
    search: str = "",
) -> QuerySet[RequestLog]:
    check_telemetry_access(user)
    qs = RequestLog.objects.all()

    if status_code and status_code.isdigit():
        qs = qs.filter(status_code=int(status_code))

    if method:
        qs = qs.filter(method=method.strip().upper())

    if search:
        val = search.strip()
        qs = qs.filter(
            Q(path__icontains=val)
            | Q(route_template__icontains=val)
            | Q(actor_label__icontains=val)
            | Q(ip_address__icontains=val)
            | Q(request_id__icontains=val)
        )

    return qs.order_by("-id")

def query_error_logs(
    user: User | SuperAdminPrincipal,
    *,
    error_class: str = "",
    search: str = "",
) -> QuerySet[ErrorLog]:
    check_telemetry_access(user)
    qs = ErrorLog.objects.all()

    if error_class:
        qs = qs.filter(error_class__icontains=error_class.strip())

    if search:
        val = search.strip()
        qs = qs.filter(
            Q(message__icontains=val)
            | Q(error_class__icontains=val)
            | Q(path__icontains=val)
            | Q(request_id__icontains=val)
            | Q(actor_label__icontains=val)
        )

    return qs.order_by("-id")
