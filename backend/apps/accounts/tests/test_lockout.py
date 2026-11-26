import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.accounts.services import clear_login_lockout, is_login_locked


@pytest.mark.django_db
def test_login_lockout_after_five_failed_attempts():
    User.objects.create_user(
        email="target@example.com",
        employee_code="SYS-0099",
        full_name="Target User",
        password="CorrectPassword123!",
    )
    client = APIClient(REMOTE_ADDR="192.168.1.100")

    for i in range(4):
        resp = client.post(
            reverse("auth_login"),
            {"identifier": "target@example.com", "password": "WrongPassword!"},
            format="json",
        )
        assert resp.status_code == 401
        assert not is_login_locked("target@example.com", "192.168.1.100")

    resp5 = client.post(
        reverse("auth_login"),
        {"identifier": "target@example.com", "password": "WrongPassword!"},
        format="json",
    )
    assert resp5.status_code == 401
    assert is_login_locked("target@example.com", "192.168.1.100")

    resp6 = client.post(
        reverse("auth_login"),
        {"identifier": "target@example.com", "password": "CorrectPassword123!"},
        format="json",
    )
    assert resp6.status_code == 429
    assert resp6.data["code"] == "account_locked"
    assert "temporarily locked" in resp6.data["message"]

    diff_ip_client = APIClient(REMOTE_ADDR="10.0.0.1")
    resp_diff_ip = diff_ip_client.post(
        reverse("auth_login"),
        {"identifier": "target@example.com", "password": "CorrectPassword123!"},
        format="json",
    )
    assert resp_diff_ip.status_code == 200

    clear_login_lockout("target@example.com", "192.168.1.100")
    resp_cleared = client.post(
        reverse("auth_login"),
        {"identifier": "target@example.com", "password": "CorrectPassword123!"},
        format="json",
    )
    assert resp_cleared.status_code == 200
