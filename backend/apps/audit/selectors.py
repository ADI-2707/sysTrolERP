import datetime
from django.db.models import Q, QuerySet
from rest_framework.exceptions import PermissionDenied
from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit.models import AuditLog

def query_audit_logs(
    user: User | SuperAdminPrincipal,
    *,
    action: str = "",
    actor: str = "",
    entity_type: str = "",
    entity_id: str = "",
    start_date: str = "",
    end_date: str = "",
    search: str = "",
) -> QuerySet[AuditLog]:
    is_super = isinstance(user, SuperAdminPrincipal) or getattr(user, "role", None) == "SUPER"
    is_admin = isinstance(user, User) and getattr(user, "role", None) == "ADMIN"

    if not (is_super or is_admin):
        raise PermissionDenied("Access to audit logs is restricted to administrators.")

    qs = AuditLog.objects.select_related("actor_user")

    if not is_super:
        qs = qs.filter(super_only=False)

    if action:
        qs = qs.filter(action=action.strip())

    if actor:
        val = actor.strip()
        qs = qs.filter(
            Q(actor_label__icontains=val)
            | Q(actor_user__employee_code__icontains=val)
            | Q(actor_user__full_name__icontains=val)
        )

    if entity_type:
        qs = qs.filter(entity_type=entity_type.strip())

    if entity_id:
        qs = qs.filter(entity_id=entity_id.strip())

    if start_date:
        try:
            start_dt = datetime.datetime.fromisoformat(start_date.strip())
            qs = qs.filter(created_at__gte=start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            end_dt = datetime.datetime.fromisoformat(end_date.strip())
            qs = qs.filter(created_at__lte=end_dt)
        except ValueError:
            pass

    if search:
        val = search.strip()
        qs = qs.filter(
            Q(summary__icontains=val)
            | Q(action__icontains=val)
            | Q(actor_label__icontains=val)
            | Q(entity_type__icontains=val)
            | Q(entity_id__icontains=val)
        )

    return qs.order_by("-id")
