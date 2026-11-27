import datetime

from django.db.models import Q, QuerySet
from django.utils import timezone

from apps.accounts.models import User


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


def list_employees(
    *,
    search: str = "",
    role: str = "",
    status: str = "",
    department: str = "",
    allocation_status: str = "",
    joined_after: str = "",
    joined_before: str = "",
    ordering: str = "employee_code",
) -> QuerySet[User]:
    qs = User.objects.all()
    if search:
        search = search.strip()
        qs = qs.filter(
            Q(full_name__icontains=search)
            | Q(email__icontains=search)
            | Q(employee_code__icontains=search)
            | Q(designation__icontains=search)
            | Q(department__icontains=search)
        )
    if role:
        qs = qs.filter(role=role)
    if department:
        qs = qs.filter(department__iexact=department.strip())
    if allocation_status == "assigned":
        qs = qs.filter(project_assignments__project__is_active=True).distinct()
    elif allocation_status == "unassigned":
        qs = qs.exclude(project_assignments__project__is_active=True)
    if joined_after:
        start_dt = _parse_filter_date(joined_after)
        if start_dt:
            qs = qs.filter(date_joined__gte=start_dt)
    if joined_before:
        end_dt = _parse_filter_date(joined_before, is_end=True)
        if end_dt:
            qs = qs.filter(date_joined__lte=end_dt)
    if status == "active":
        qs = qs.filter(is_active=True, revoked_at__isnull=True)
    elif status == "revoked":
        qs = qs.filter(Q(is_active=False) | Q(revoked_at__isnull=False))

    valid_orderings = {
        "employee_code",
        "-employee_code",
        "full_name",
        "-full_name",
        "email",
        "-email",
        "date_joined",
        "-date_joined",
        "last_login",
        "-last_login",
        "department",
        "-department",
    }
    if ordering in valid_orderings:
        qs = qs.order_by(ordering)
    else:
        qs = qs.order_by("employee_code")

    return qs


def get_employee_by_id(employee_id: int | str) -> User | None:
    return User.objects.filter(id=employee_id).first()
