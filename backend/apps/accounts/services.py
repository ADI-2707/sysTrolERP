from datetime import timedelta
import hmac
import time
from django.conf import settings
from django.contrib.auth.hashers import Argon2PasswordHasher, check_password
from django.db import OperationalError, models, transaction
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed
from apps.accounts.models import EmployeeCodeSequence, LoginAttempt, User
from apps.accounts.principals import SuperAdminPrincipal

def is_login_locked(identifier: str, ip_address: str, max_attempts: int = 5, lock_minutes: int = 15) -> bool:
    cutoff = timezone.now() - timedelta(minutes=lock_minutes)
    failures = LoginAttempt.objects.filter(
        identifier=identifier.lower().strip(),
        ip_address=ip_address,
        successful=False,
        attempted_at__gte=cutoff,
    ).count()
    return failures >= max_attempts

def record_login_attempt(identifier: str, ip_address: str, successful: bool):
    LoginAttempt.objects.create(
        identifier=identifier.lower().strip(),
        ip_address=ip_address,
        successful=successful,
        attempted_at=timezone.now(),
    )

def clear_login_lockout(identifier: str, ip_address: str | None = None):
    qs = LoginAttempt.objects.filter(identifier=identifier.lower().strip(), successful=False)
    if ip_address:
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
    super_username = getattr(settings, "SUPER_ADMIN_USERNAME", "superadmin")
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
