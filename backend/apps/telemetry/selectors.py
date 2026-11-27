import datetime

from django.db.models import Q, QuerySet
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal
from apps.telemetry.models import ErrorLog, RequestLog


def check_telemetry_access(user: User | SuperAdminPrincipal) -> None:
    is_super = isinstance(user, SuperAdminPrincipal) or getattr(user, "role", None) == "SUPER"
    is_admin = isinstance(user, User) and getattr(user, "role", None) == "ADMIN"
    if not (is_super or is_admin):
        raise PermissionDenied("Access to telemetry logs is restricted to administrators.")


def _parse_filter_date(val: str, is_end: bool = False) -> datetime.datetime | None:
    if not val:
        return None
    val = val.strip()
    try:
        dt = datetime.datetime.fromisoformat(val)
        if len(val) <= 10 and is_end:
            dt = dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt)
        return dt
    except (ValueError, TypeError):
        return None


def query_request_logs(
    user: User | SuperAdminPrincipal,
    *,
    status_code: str = "",
    status_class: str = "",
    min_duration_ms: str = "",
    method: str = "",
    search: str = "",
    start_date: str = "",
    end_date: str = "",
) -> QuerySet[RequestLog]:
    check_telemetry_access(user)
    qs = RequestLog.objects.all()

    if status_code and status_code.isdigit():
        qs = qs.filter(status_code=int(status_code))

    if status_class:
        sc = status_class.strip().lower()
        if sc == "2xx":
            qs = qs.filter(status_code__gte=200, status_code__lt=300)
        elif sc == "4xx":
            qs = qs.filter(status_code__gte=400, status_code__lt=500)
        elif sc == "5xx":
            qs = qs.filter(status_code__gte=500, status_code__lt=600)

    if min_duration_ms:
        try:
            dur = float(min_duration_ms.strip())
            qs = qs.filter(duration_ms__gte=dur)
        except ValueError:
            pass

    if method:
        qs = qs.filter(method=method.strip().upper())

    start_dt = _parse_filter_date(start_date)
    if start_dt:
        qs = qs.filter(created_at__gte=start_dt)

    end_dt = _parse_filter_date(end_date, is_end=True)
    if end_dt:
        qs = qs.filter(created_at__lte=end_dt)

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
    start_date: str = "",
    end_date: str = "",
) -> QuerySet[ErrorLog]:
    check_telemetry_access(user)
    qs = ErrorLog.objects.all()

    if error_class:
        qs = qs.filter(error_class__icontains=error_class.strip())

    start_dt = _parse_filter_date(start_date)
    if start_dt:
        qs = qs.filter(created_at__gte=start_dt)

    end_dt = _parse_filter_date(end_date, is_end=True)
    if end_dt:
        qs = qs.filter(created_at__lte=end_dt)

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


def calculate_metrics_for_window(start_time: datetime.datetime) -> dict:
    req_qs = RequestLog.objects.filter(created_at__gte=start_time)
    err_qs = ErrorLog.objects.filter(created_at__gte=start_time)

    total_requests = req_qs.count()
    error_count = err_qs.count()

    durations = list(req_qs.values_list("duration_ms", flat=True).order_by("duration_ms"))

    if durations:
        avg_duration = round(sum(durations) / len(durations), 1)
        p95_idx = int(len(durations) * 0.95)
        if p95_idx >= len(durations):
            p95_idx = len(durations) - 1
        p95_duration = round(durations[p95_idx], 1)
    else:
        avg_duration = 0.0
        p95_duration = 0.0

    return {
        "total_requests": total_requests,
        "error_count": error_count,
        "avg_duration_ms": avg_duration,
        "p95_duration_ms": p95_duration,
    }


def get_telemetry_summary() -> dict:
    now = timezone.now()
    return {
        "1h": calculate_metrics_for_window(now - datetime.timedelta(hours=1)),
        "24h": calculate_metrics_for_window(now - datetime.timedelta(hours=24)),
        "7d": calculate_metrics_for_window(now - datetime.timedelta(days=7)),
    }
