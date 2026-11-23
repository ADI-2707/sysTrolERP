import pytest
from django.contrib.auth import login
from django.contrib.sessions.models import Session
from django.test import Client
from django.urls import reverse
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.accounts.services import authenticate_principal, revoke_user

@pytest.mark.django_db
def test_revoke_terminates_sessions_and_blocks_requests():
    user = User.objects.create_user(
        email="revoketest@example.com",
        employee_code="SYS-0077",
        full_name="Revoke Test User",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )
    client = APIClient()
    login_resp = client.post(
        reverse("auth_login"),
        {"identifier": "revoketest@example.com", "password": "ValidPassword123!"},
        format="json",
    )
    assert login_resp.status_code == 200

    active_count = sum(
        1 for s in Session.objects.all()
        if s.get_decoded().get("_auth_user_id") == str(user.id)
    )
    assert active_count >= 1

    me_resp_before = client.get(reverse("auth_me"))
    assert me_resp_before.status_code == 200

    revoke_user(user, revoked_by=None)

    remaining_count = sum(
        1 for s in Session.objects.all()
        if s.get_decoded().get("_auth_user_id") == str(user.id)
    )
    assert remaining_count == 0

    me_resp_after = client.get(reverse("auth_me"))
    assert me_resp_after.status_code in (401, 403)

    with pytest.raises(AuthenticationFailed, match="Account is deactivated or revoked."):
        authenticate_principal("revoketest@example.com", "ValidPassword123!")
