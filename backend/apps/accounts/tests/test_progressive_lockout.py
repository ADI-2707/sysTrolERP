import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import LoginAttempt, User
from apps.accounts.services import (
    clear_login_lockout,
    evaluate_login_security,
    record_login_attempt,
)


@pytest.mark.django_db
def test_shared_wifi_different_devices_isolation():
    User.objects.create_user(
        email="user_a@example.com",
        employee_code="SYS-0101",
        full_name="User A",
        password="PasswordA123!",
    )
    User.objects.create_user(
        email="user_b@example.com",
        employee_code="SYS-0102",
        full_name="User B",
        password="PasswordB123!",
    )

    shared_ip = "192.168.1.50"
    client_a = APIClient(REMOTE_ADDR=shared_ip)
    client_b = APIClient(REMOTE_ADDR=shared_ip)

    for _ in range(5):
        resp = client_a.post(
            reverse("auth_login"),
            {
                "identifier": "user_a@example.com",
                "password": "WrongPassword!",
                "device_id": "device_laptop_a",
            },
            format="json",
        )
        assert resp.status_code == 401

    resp_a_locked = client_a.post(
        reverse("auth_login"),
        {
            "identifier": "user_a@example.com",
            "password": "PasswordA123!",
            "device_id": "device_laptop_a",
        },
        format="json",
    )
    assert resp_a_locked.status_code == 429
    assert resp_a_locked.data["code"] == "account_locked"
    assert "2 minutes" in resp_a_locked.data["message"]

    resp_b_success = client_b.post(
        reverse("auth_login"),
        {
            "identifier": "user_b@example.com",
            "password": "PasswordB123!",
            "device_id": "device_laptop_b",
        },
        format="json",
    )
    assert resp_b_success.status_code == 200
    assert resp_b_success.data["email"] == "user_b@example.com"


@pytest.mark.django_db
def test_honeypot_trap_blocks_bot_instantly():
    client = APIClient(REMOTE_ADDR="198.51.100.22")

    resp = client.post(
        reverse("auth_login"),
        {
            "identifier": "random_user@example.com",
            "password": "AnyPassword123!",
            "company_tax_id": "malicious_bot_autofill",
        },
        format="json",
    )
    assert resp.status_code == 401
    assert resp.data["code"] == "authentication_failed"

    last_attempt = LoginAttempt.objects.filter(identifier="random_user@example.com").first()
    assert last_attempt is not None
    assert last_attempt.failure_reason == "HONEYPOT_TRIGGERED"
    assert last_attempt.successful is False


@pytest.mark.django_db
def test_progressive_lockout_tiers_and_super_clear():
    User.objects.create_user(
        email="tiered@example.com",
        employee_code="SYS-0103",
        full_name="Tiered User",
        password="TieredPassword123!",
    )

    client = APIClient(REMOTE_ADDR="10.20.30.40")
    device = "test_device_tiered"

    for _ in range(3):
        resp = client.post(
            reverse("auth_login"),
            {"identifier": "tiered@example.com", "password": "Bad", "device_id": device},
            format="json",
        )
        assert resp.status_code == 401

    eval_4 = evaluate_login_security("tiered@example.com", "10.20.30.40", device_id=device)
    assert eval_4["action"] == "tarpit"
    assert eval_4["tarpit"] == 2.0

    resp4 = client.post(
        reverse("auth_login"),
        {"identifier": "tiered@example.com", "password": "Bad", "device_id": device},
        format="json",
    )
    assert resp4.status_code == 401

    resp5 = client.post(
        reverse("auth_login"),
        {"identifier": "tiered@example.com", "password": "Bad", "device_id": device},
        format="json",
    )
    assert resp5.status_code == 401

    resp_tier1 = client.post(
        reverse("auth_login"),
        {"identifier": "tiered@example.com", "password": "TieredPassword123!", "device_id": device},
        format="json",
    )
    assert resp_tier1.status_code == 429
    assert "2 minutes" in resp_tier1.data["message"]
    assert resp_tier1.headers.get("Retry-After") is not None

    record_login_attempt("tiered@example.com", "10.20.30.40", successful=False, device_id=device)
    record_login_attempt("tiered@example.com", "10.20.30.40", successful=False, device_id=device)

    resp_tier2 = client.post(
        reverse("auth_login"),
        {"identifier": "tiered@example.com", "password": "TieredPassword123!", "device_id": device},
        format="json",
    )
    assert resp_tier2.status_code == 429
    assert "15 minutes" in resp_tier2.data["message"]

    record_login_attempt("tiered@example.com", "10.20.30.40", successful=False, device_id=device)

    resp_tier3 = client.post(
        reverse("auth_login"),
        {"identifier": "tiered@example.com", "password": "TieredPassword123!", "device_id": device},
        format="json",
    )
    assert resp_tier3.status_code == 429
    assert "minutes" in resp_tier3.data["message"]

    clear_login_lockout("tiered@example.com", device_id=device)

    resp_unlocked = client.post(
        reverse("auth_login"),
        {"identifier": "tiered@example.com", "password": "TieredPassword123!", "device_id": device},
        format="json",
    )
    assert resp_unlocked.status_code == 200
    assert resp_unlocked.data["email"] == "tiered@example.com"


@pytest.mark.django_db
def test_untrusted_network_aggregate_spray_protection():
    attacker_ip = "203.0.113.199"

    for i in range(25):
        record_login_attempt(
            identifier=f"victim_{i}@example.com",
            ip_address=attacker_ip,
            successful=False,
            device_id=f"device_{i}",
        )

    eval_spray = evaluate_login_security(
        "another_victim@example.com", attacker_ip, device_id="device_new"
    )
    assert eval_spray["action"] == "lockout"
    assert eval_spray["reason"] == "IP_SPRAY_DETECTED"
    assert "1 hour" in eval_spray["message"]

    trusted_ip = "127.0.0.1"
    for i in range(25):
        record_login_attempt(
            identifier=f"trusted_{i}@example.com",
            ip_address=trusted_ip,
            successful=False,
            device_id=f"trusted_dev_{i}",
        )

    eval_trusted = evaluate_login_security(
        "legit_user@example.com", trusted_ip, device_id="trusted_new"
    )
    assert eval_trusted["action"] == "allow"
