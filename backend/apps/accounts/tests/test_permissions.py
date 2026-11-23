import pytest
from django.test import RequestFactory
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.accounts.permissions import IsAdmin, IsAdminOrSuper, IsAuthenticatedPrincipal, IsSuper
from apps.accounts.principals import SuperAdminPrincipal

class DummyRequest:
    def __init__(self, user):
        self.user = user

def test_permissions_matrix():
    super_principal = SuperAdminPrincipal()
    admin_user = User(email="admin@example.com", role=UserRole.ADMIN, is_active=True)
    employee_user = User(email="emp@example.com", role=UserRole.EMPLOYEE, is_active=True)

    class AnonUser:
        is_authenticated = False
        role = ""

    anon_user = AnonUser()

    is_super = IsSuper()
    assert is_super.has_permission(DummyRequest(super_principal), None) is True
    assert is_super.has_permission(DummyRequest(admin_user), None) is False
    assert is_super.has_permission(DummyRequest(employee_user), None) is False
    assert is_super.has_permission(DummyRequest(anon_user), None) is False

    is_admin_or_super = IsAdminOrSuper()
    assert is_admin_or_super.has_permission(DummyRequest(super_principal), None) is True
    assert is_admin_or_super.has_permission(DummyRequest(admin_user), None) is True
    assert is_admin_or_super.has_permission(DummyRequest(employee_user), None) is False
    assert is_admin_or_super.has_permission(DummyRequest(anon_user), None) is False

    is_auth = IsAuthenticatedPrincipal()
    assert is_auth.has_permission(DummyRequest(super_principal), None) is True
    assert is_auth.has_permission(DummyRequest(admin_user), None) is True
    assert is_auth.has_permission(DummyRequest(employee_user), None) is True
    assert is_auth.has_permission(DummyRequest(anon_user), None) is False

@pytest.mark.django_db
def test_must_change_password_gate_middleware():
    user = User.objects.create_user(
        email="gate@example.com",
        employee_code="SYS-0080",
        full_name="Gate User",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
        must_change_password=True,
    )
    client = APIClient()
    client.post(
        reverse("auth_login"),
        {"identifier": "gate@example.com", "password": "ValidPassword123!"},
        format="json",
    )

    me_resp = client.get(reverse("auth_me"))
    assert me_resp.status_code == 200

    blocked_resp = client.get(reverse("schema"))
    assert blocked_resp.status_code == 403
    assert blocked_resp.json()["code"] == "password_change_required"
