import pytest
from django.contrib.auth.hashers import Argon2PasswordHasher
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed
from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal
from apps.accounts.services import authenticate_principal

@pytest.mark.django_db
def test_authenticate_super_admin(settings):
    hasher = Argon2PasswordHasher()
    hashed = hasher.encode("SuperSecret123!", hasher.salt())
    settings.SUPER_ADMIN_USERNAME = "superadmin"
    settings.SUPER_ADMIN_PASSWORD_HASH = hashed

    principal = authenticate_principal("superadmin", "SuperSecret123!")
    assert isinstance(principal, SuperAdminPrincipal)
    assert principal.username == "superadmin"

@pytest.mark.django_db
def test_authenticate_super_admin_invalid_password(settings):
    hasher = Argon2PasswordHasher()
    hashed = hasher.encode("SuperSecret123!", hasher.salt())
    settings.SUPER_ADMIN_USERNAME = "superadmin"
    settings.SUPER_ADMIN_PASSWORD_HASH = hashed

    with pytest.raises(AuthenticationFailed, match="Invalid credentials."):
        authenticate_principal("superadmin", "WrongPassword123!")

@pytest.mark.django_db
def test_authenticate_database_user():
    user = User.objects.create_user(
        email="emp@company.com",
        employee_code="SYS-0010",
        full_name="Valid Employee",
        password="ValidPassword123!",
    )

    auth_by_email = authenticate_principal("emp@company.com", "ValidPassword123!")
    assert auth_by_email.pk == user.pk

    auth_by_code = authenticate_principal("SYS-0010", "ValidPassword123!")
    assert auth_by_code.pk == user.pk

@pytest.mark.django_db
def test_authenticate_database_user_invalid_password():
    User.objects.create_user(
        email="emp2@company.com",
        employee_code="SYS-0011",
        full_name="Valid Employee 2",
        password="ValidPassword123!",
    )
    with pytest.raises(AuthenticationFailed, match="Invalid credentials."):
        authenticate_principal("emp2@company.com", "WrongPassword123!")

@pytest.mark.django_db
def test_authenticate_revoked_user():
    User.objects.create_user(
        email="revoked@company.com",
        employee_code="SYS-0012",
        full_name="Revoked User",
        password="ValidPassword123!",
        revoked_at=timezone.now(),
    )
    with pytest.raises(AuthenticationFailed, match="Account is deactivated or revoked."):
        authenticate_principal("revoked@company.com", "ValidPassword123!")

@pytest.mark.django_db
def test_authenticate_nonexistent_user():
    with pytest.raises(AuthenticationFailed, match="Invalid credentials."):
        authenticate_principal("nobody@company.com", "SomePassword123!")
