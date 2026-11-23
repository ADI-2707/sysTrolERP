from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit.context import get_current_request
from apps.audit.models import ActorKind, AuditLog

def get_client_ip_from_meta(meta):
    x_forwarded = meta.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return meta.get("REMOTE_ADDR")

def record(
    *,
    action: str,
    actor: User | SuperAdminPrincipal | None = None,
    entity_type: str = "",
    entity_id: str = "",
    summary: str = "",
    changes: dict | None = None,
    request=None,
    super_only: bool = False,
) -> AuditLog:
    if request is None:
        request = get_current_request()

    actor_kind = ActorKind.SYSTEM
    actor_user = None
    actor_label = "system"

    if actor is None and request and hasattr(request, "user") and request.user.is_authenticated:
        actor = request.user

    if actor is not None:
        if isinstance(actor, SuperAdminPrincipal):
            actor_kind = ActorKind.SUPER
            actor_label = f"SUPER:{actor.username}"
            super_only = True
        elif isinstance(actor, User):
            actor_kind = ActorKind.ADMIN if actor.role == "ADMIN" else ActorKind.EMPLOYEE
            actor_user = actor
            actor_label = actor.employee_code
        else:
            actor_kind = ActorKind.ANONYMOUS
            actor_label = str(actor)

    ip_address = None
    user_agent = ""
    request_id = ""

    if request is not None:
        ip_address = get_client_ip_from_meta(request.META)
        user_agent = request.META.get("HTTP_USER_AGENT", "")
        request_id = getattr(request, "request_id", "")

    return AuditLog.objects.create(
        actor_kind=actor_kind,
        actor_user=actor_user,
        actor_label=actor_label,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        summary=summary,
        changes=changes or {},
        ip_address=ip_address,
        user_agent=user_agent,
        request_id=request_id,
        super_only=super_only,
    )
