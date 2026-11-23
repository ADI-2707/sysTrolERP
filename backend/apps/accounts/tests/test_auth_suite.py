import pytest
from django.contrib.auth.hashers import Argon2PasswordHasher
from django.contrib.sessions.models import Session
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.accounts.principals import SuperAdminPrincipal
from apps.accounts.services import authenticate_principal, revoke_user

@pytest.mark.django_db
def test_full_auth_lifecycle(settings):
    hasher = Argon2PasswordHasher()
    hashed = hasher.encode("SuperSecret123!", hasher.salt())
    settings.SUPER_ADMIN_USERNAME = "superadmin"
    settings.SUPER_ADMIN_PASSWORD_HASH = hashed

    super_client = APIClient()
    super_login = super_client.post(
        reverse("auth_login"),
        {"identifier": "superadmin", "password": "SuperSecret123!"},
        format="json",
    )
    assert super_login.status_code == 200
    assert super_login.data["role"] == "SUPER"
    assert User.objects.filter(email="superadmin").exists() is False

    super_pwd_change = super_client.post(
        reverse("auth_password_change"),
        {
            "current_password": "SuperSecret123!",
            "new_password": "NewSuperSecret123!",
            "confirm_password": "NewSuperSecret123!",
        },
        format="json",
    )
    assert super_pwd_change.status_code == 403

    user = User.objects.create_user(
        email="emp.lifecycle@company.com",
        employee_code="SYS-0999",
        full_name="Lifecycle Employee",
        password="TempPassword123!",
        role=UserRole.EMPLOYEE,
        must_change_password=True,
    )

    user_client = APIClient()
    user_login = user_client.post(
        reverse("auth_login"),
        {"identifier": "SYS-0999", "password": "TempPassword123!"},
        format="json",
    )
    assert user_login.status_code == 200
    assert user_login.data["must_change_password"] is True

    blocked = user_client.get(reverse("schema"))
    assert blocked.status_code == 403
    assert blocked.json()["code"] == "password_change_required"

    pwd_change = user_client.post(
        reverse("auth_password_change"),
        {
            "current_password": "TempPassword123!",
            "new_password": "PermanentPassword123!",
            "confirm_password": "PermanentPassword123!",
        },
        format="json",
    )
    assert pwd_change.status_code == 200

    unblocked = user_client.get(reverse("schema"))
    assert unblocked.status_code == 200

    revoke_user(user)

    post_revoke = user_client.get(reverse("auth_me"))
    assert post_revoke.status_code in (401, 403)

    re_login = user_client.post(
        reverse("auth_login"),
        {"identifier": "emp.lifecycle@company.com", "password": "PermanentPassword123!"},
        format="json",
    )
    assert re_login.status_code == 401
