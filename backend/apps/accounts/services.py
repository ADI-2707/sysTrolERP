import hmac
import time
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import Argon2PasswordHasher
from django.contrib.sessions.models import Session
from django.db import OperationalError, models, transaction
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed

from apps.accounts.models import EmployeeCodeSequence, LoginAttempt, User
from apps.accounts.principals import SuperAdminPrincipal


def terminate_user_sessions(user: User):
    user_id_str = str(user.id)
    now = timezone.now()
    active_sessions = Session.objects.filter(expire_date__gte=now)
    sessions_to_delete = []
    for session in active_sessions:
        try:
            data = session.get_decoded()
            if data.get("_auth_user_id") == user_id_str:
                sessions_to_delete.append(session.session_key)
        except Exception:
            continue
    if sessions_to_delete:
        Session.objects.filter(session_key__in=sessions_to_delete).delete()


def revoke_user(user: User, revoked_by: User | SuperAdminPrincipal | None = None, reason: str = ""):
    user.is_active = False
    user.revoked_at = timezone.now()
    if isinstance(revoked_by, User):
        user.revoked_by = revoked_by
    else:
        user.revoked_by = None
    user.save(update_fields=["is_active", "revoked_at", "revoked_by"])
    terminate_user_sessions(user)


def get_device_id_from_request(request) -> str:
    if not request:
        return ""
    dev_id = request.COOKIES.get("sys_dev_id", "")
    if not dev_id:
        dev_id = request.headers.get("X-Device-Id", "") or request.META.get("HTTP_X_DEVICE_ID", "")
    dev_id = dev_id.strip()
    if dev_id and len(dev_id) <= 64:
        return dev_id
    return ""


def evaluate_login_security(
    identifier: str,
    ip_address: str,
    device_id: str = "",
    honeypot_value: str = "",
) -> dict:
    if honeypot_value and honeypot_value.strip():
        return {
            "action": "reject_bot",
            "lock_seconds": 0,
            "retry_after": 0,
            "reason": "HONEYPOT_TRIGGERED",
            "message": "Invalid request submission.",
        }

    clean_ip = ip_address.strip()
    trusted = getattr(settings, "TRUSTED_NETWORKS", ["127.0.0.1", "::1"])
    if clean_ip not in trusted:
        cutoff_ip = timezone.now() - timedelta(minutes=15)
        ip_failures = LoginAttempt.objects.filter(
            ip_address=clean_ip,
            successful=False,
            attempted_at__gte=cutoff_ip,
        ).count()
        threshold = getattr(settings, "AGGREGATE_IP_LOCKOUT_THRESHOLD", 25)
        if ip_failures >= threshold:
            return {
                "action": "lockout",
                "lock_seconds": 3600,
                "retry_after": 3600,
                "reason": "IP_SPRAY_DETECTED",
                "message": "Too many failed attempts from this network. Temporarily blocked for 1 hour.",
            }

    clean_id = identifier.lower().strip()
    clean_dev = device_id.strip()
    now = timezone.now()
    window = now - timedelta(hours=1)

    scope_filter = {"identifier": clean_id}
    if clean_dev:
        scope_filter["device_id"] = clean_dev
    else:
        scope_filter["ip_address"] = clean_ip

    last_success = (
        LoginAttempt.objects.filter(**scope_filter, successful=True)
        .order_by("-attempted_at")
        .values_list("attempted_at", flat=True)
        .first()
    )

    if last_success and last_success > window:
        start_time = last_success
    else:
        start_time = window

    failures = list(
        LoginAttempt.objects.filter(
            **scope_filter,
            successful=False,
            attempted_at__gte=start_time,
        ).order_by("-attempted_at")
    )
    fail_count = len(failures)

    if fail_count < 3:
        return {"action": "allow", "tarpit": 0.0, "failures": fail_count}

    if fail_count in (3, 4):
        return {"action": "tarpit", "tarpit": 2.0, "failures": fail_count}

    most_recent = failures[0].attempted_at
    elapsed = (now - most_recent).total_seconds()

    if fail_count == 5:
        duration = 120
        if elapsed < duration:
            remaining = int(duration - elapsed)
            return {
                "action": "lockout",
                "lock_seconds": remaining,
                "retry_after": remaining,
                "reason": "DEVICE_TIER1_LOCKOUT",
                "message": "Too many failed login attempts. Account is temporarily locked for 2 minutes.",
            }
        return {"action": "allow", "tarpit": 0.0, "failures": fail_count}

    if 6 <= fail_count <= 7:
        duration = 900
        if elapsed < duration:
            remaining = int(duration - elapsed)
            remaining_mins = max(1, int((remaining + 59) // 60))
            return {
                "action": "lockout",
                "lock_seconds": remaining,
                "retry_after": remaining,
                "reason": "DEVICE_TIER2_LOCKOUT",
                "message": f"Too many failed login attempts. Account is temporarily locked for {remaining_mins} minutes.",
            }
        return {"action": "allow", "tarpit": 0.0, "failures": fail_count}

    duration = 3600
    if elapsed < duration:
        remaining = int(duration - elapsed)
        remaining_mins = max(1, int((remaining + 59) // 60))
        return {
            "action": "lockout",
            "lock_seconds": remaining,
            "retry_after": remaining,
            "reason": "DEVICE_TIER3_LOCKOUT",
            "message": f"Too many failed login attempts. Account is locked on this device for {remaining_mins} minutes. Contact administrator.",
        }
    return {"action": "allow", "tarpit": 0.0, "failures": fail_count}


def is_login_locked(
    identifier: str,
    ip_address: str,
    device_id: str = "",
    max_attempts: int = 5,
    lock_minutes: int = 15,
) -> bool:
    res = evaluate_login_security(
        identifier=identifier,
        ip_address=ip_address,
        device_id=device_id,
    )
    return res.get("action") == "lockout"


def record_login_attempt(
    identifier: str,
    ip_address: str,
    successful: bool,
    device_id: str = "",
    failure_reason: str = "",
):
    LoginAttempt.objects.create(
        identifier=identifier.lower().strip(),
        ip_address=ip_address,
        device_id=device_id.strip(),
        successful=successful,
        failure_reason=failure_reason.strip(),
        attempted_at=timezone.now(),
    )


def clear_login_lockout(
    identifier: str,
    ip_address: str | None = None,
    device_id: str | None = None,
):
    qs = LoginAttempt.objects.filter(identifier=identifier.lower().strip(), successful=False)
    if device_id:
        qs = qs.filter(device_id=device_id.strip())
    elif ip_address:
        qs = qs.filter(ip_address=ip_address)
    qs.delete()


def generate_next_employee_code(prefix: str = "SYS-", padding: int = 4) -> str:
    max_retries = 20
    for attempt in range(max_retries):
        try:
            with transaction.atomic():
                seq, _ = EmployeeCodeSequence.objects.select_for_update().get_or_create(
                    name="employee_code",
                    defaults={"last_number": 0},
                )
                seq.last_number += 1
                seq.save(update_fields=["last_number"])
                return f"{prefix}{seq.last_number:0{padding}d}"
        except OperationalError:
            if attempt == max_retries - 1:
                raise
            time.sleep(0.05 * (attempt + 1))


def authenticate_principal(identifier: str, password: str) -> User | SuperAdminPrincipal:
    identifier = identifier.strip()
    super_username = str(getattr(settings, "SUPER_ADMIN_USERNAME", "9999")).strip()
    super_hash = getattr(settings, "SUPER_ADMIN_PASSWORD_HASH", "")

    if hmac.compare_digest(identifier.lower(), super_username.lower()):
        if super_hash:
            try:
                hasher = Argon2PasswordHasher()
                if hasher.verify(password, super_hash):
                    return SuperAdminPrincipal(username=super_username)
            except Exception:
                pass
        raise AuthenticationFailed("Invalid credentials.")

    user = User.objects.filter(
        models.Q(email__iexact=identifier) | models.Q(employee_code__iexact=identifier)
    ).first()

    if user is None:
        User().set_password("dummy_password_timing_pad")
        raise AuthenticationFailed("Invalid credentials.")

    if not user.check_password(password):
        raise AuthenticationFailed("Invalid credentials.")

    if not user.is_active or user.revoked_at is not None:
        raise AuthenticationFailed("Account is deactivated or revoked.")

    return user
