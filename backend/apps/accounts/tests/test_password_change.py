import pytest
from django.contrib.auth.hashers import Argon2PasswordHasher
from django.contrib.sessions.models import Session
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole

@pytest.mark.django_db
def test_password_change_success():
    user = User.objects.create_user(
        email="change@example.com",
        employee_code="SYS-0050",
        full_name="Change User",
        password="OldPassword123!",
        role=UserRole.EMPLOYEE,
        must_change_password=True,
    )
    client1 = APIClient()
    client1.post(
        reverse("auth_login"),
        {"identifier": "change@example.com", "password": "OldPassword123!"},
        format="json",
    )

    client2 = APIClient()
    client2.post(
        reverse("auth_login"),
        {"identifier": "change@example.com", "password": "OldPassword123!"},
        format="json",
    )

    user_sessions_before = [
        s for s in Session.objects.all()
        if s.get_decoded().get("_auth_user_id") == str(user.id)
    ]
    assert len(user_sessions_before) == 2

    resp = client1.post(
        reverse("auth_password_change"),
        {
            "current_password": "OldPassword123!",
            "new_password": "BrandNewPassword123!",
            "confirm_password": "BrandNewPassword123!",
        },
        format="json",
    )
    assert resp.status_code == 200
    assert resp.data["message"] == "Password changed successfully."

    user.refresh_from_db()
    assert user.check_password("BrandNewPassword123!") is True
    assert user.must_change_password is False

    me_resp1 = client1.get(reverse("auth_me"))
    assert me_resp1.status_code == 200

    me_resp2 = client2.get(reverse("auth_me"))
    assert me_resp2.status_code in (401, 403)

@pytest.mark.django_db
def test_password_change_wrong_current_password():
    User.objects.create_user(
        email="wrong@example.com",
        employee_code="SYS-0051",
        full_name="Wrong User",
        password="CorrectPassword123!",
    )
    client = APIClient()
    client.post(
        reverse("auth_login"),
        {"identifier": "wrong@example.com", "password": "CorrectPassword123!"},
        format="json",
    )
    resp = client.post(
        reverse("auth_password_change"),
        {
            "current_password": "NotThePassword123!",
            "new_password": "BrandNewPassword123!",
            "confirm_password": "BrandNewPassword123!",
        },
        format="json",
    )
    assert resp.status_code == 400
    assert "current_password" in resp.data["fields"]

@pytest.mark.django_db
def test_password_change_blocked_for_super_admin(settings):
    hasher = Argon2PasswordHasher()
    hashed = hasher.encode("SuperSecret123!", hasher.salt())
    settings.SUPER_ADMIN_USERNAME = "superadmin"
    settings.SUPER_ADMIN_PASSWORD_HASH = hashed

    client = APIClient()
    client.post(
        reverse("auth_login"),
        {"identifier": "superadmin", "password": "SuperSecret123!"},
        format="json",
    )

    resp = client.post(
        reverse("auth_password_change"),
        {
            "current_password": "SuperSecret123!",
            "new_password": "NewSuperSecret123!",
            "confirm_password": "NewSuperSecret123!",
        },
        format="json",
    )
    assert resp.status_code == 403
    assert "cannot be changed via UI" in resp.data["message"]
