import pytest
from django.contrib.auth.hashers import Argon2PasswordHasher
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole

@pytest.mark.django_db
def test_csrf_endpoint():
    client = APIClient()
    response = client.get(reverse("auth_csrf"))
    assert response.status_code == 200
    assert "csrfToken" in response.data

@pytest.mark.django_db
def test_login_and_me_database_user():
    user = User.objects.create_user(
        email="emp@example.com",
        employee_code="SYS-0001",
        full_name="Test Employee",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )
    client = APIClient()
    login_resp = client.post(
        reverse("auth_login"),
        {"identifier": "emp@example.com", "password": "ValidPassword123!"},
        format="json",
    )
    assert login_resp.status_code == 200
    assert login_resp.data["email"] == "emp@example.com"
    assert login_resp.data["role"] == "EMPLOYEE"

    me_resp = client.get(reverse("auth_me"))
    assert me_resp.status_code == 200
    assert me_resp.data["id"] == user.id
    assert me_resp.data["role"] == "EMPLOYEE"

    logout_resp = client.post(reverse("auth_logout"))
    assert logout_resp.status_code == 200

    unauth_resp = client.get(reverse("auth_me"))
    assert unauth_resp.status_code == 403 or unauth_resp.status_code == 401

@pytest.mark.django_db
def test_login_and_me_super_admin(settings):
    hasher = Argon2PasswordHasher()
    hashed = hasher.encode("SuperSecret123!", hasher.salt())
    settings.SUPER_ADMIN_USERNAME = "superadmin"
    settings.SUPER_ADMIN_PASSWORD_HASH = hashed

    client = APIClient()
    login_resp = client.post(
        reverse("auth_login"),
        {"identifier": "superadmin", "password": "SuperSecret123!"},
        format="json",
    )
    assert login_resp.status_code == 200
    assert login_resp.data["role"] == "SUPER"
    assert login_resp.data["employee_code"] == "SUPER-ADMIN"

    me_resp = client.get(reverse("auth_me"))
    assert me_resp.status_code == 200
    assert me_resp.data["role"] == "SUPER"

    logout_resp = client.post(reverse("auth_logout"))
    assert logout_resp.status_code == 200
