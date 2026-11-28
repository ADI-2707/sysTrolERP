import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.notifications.models import Notification


@pytest.mark.django_db
def test_unread_count_and_auth():
    client = APIClient()
    res = client.get("/api/notifications/unread-count/")
    assert res.status_code == status.HTTP_403_FORBIDDEN

    user = User.objects.create_user(
        employee_code="API-001",
        email="api1@example.com",
        full_name="Api User One",
        role=UserRole.EMPLOYEE,
        password="Password123!",
    )
    client.force_authenticate(user=user)

    res = client.get("/api/notifications/unread-count/")
    assert res.status_code == status.HTTP_200_OK
    assert res.data == {"unread_count": 0, "has_unread": False}

    Notification.objects.create(
        recipient=user,
        event_type="TEST",
        title="Test Title",
        body="Test Body",
    )

    res = client.get("/api/notifications/unread-count/")
    assert res.status_code == status.HTTP_200_OK
    assert res.data == {"unread_count": 1, "has_unread": True}


@pytest.mark.django_db
def test_list_notifications_user_isolation():
    user1 = User.objects.create_user(
        employee_code="API-002",
        email="api2@example.com",
        full_name="Api User Two",
        role=UserRole.EMPLOYEE,
        password="Password123!",
    )
    user2 = User.objects.create_user(
        employee_code="API-003",
        email="api3@example.com",
        full_name="Api User Three",
        role=UserRole.EMPLOYEE,
        password="Password123!",
    )

    Notification.objects.create(
        recipient=user1,
        event_type="TEST_1",
        title="User 1 Notif",
        body="Body 1",
    )
    Notification.objects.create(
        recipient=user2,
        event_type="TEST_2",
        title="User 2 Notif",
        body="Body 2",
    )

    client = APIClient()
    client.force_authenticate(user=user1)

    res = client.get("/api/notifications/")
    assert res.status_code == status.HTTP_200_OK
    assert res.data["count"] == 1
    assert res.data["results"][0]["title"] == "User 1 Notif"


@pytest.mark.django_db
def test_mark_read_and_mark_all_read():
    user = User.objects.create_user(
        employee_code="API-004",
        email="api4@example.com",
        full_name="Api User Four",
        role=UserRole.EMPLOYEE,
        password="Password123!",
    )
    other = User.objects.create_user(
        employee_code="API-005",
        email="api5@example.com",
        full_name="Api User Five",
        role=UserRole.EMPLOYEE,
        password="Password123!",
    )

    n1 = Notification.objects.create(
        recipient=user,
        event_type="TEST_1",
        title="Notif 1",
        body="Body 1",
    )
    n2 = Notification.objects.create(
        recipient=user,
        event_type="TEST_2",
        title="Notif 2",
        body="Body 2",
    )
    n_other = Notification.objects.create(
        recipient=other,
        event_type="TEST_3",
        title="Notif Other",
        body="Body Other",
    )

    client = APIClient()
    client.force_authenticate(user=user)

    res = client.post(f"/api/notifications/{n_other.id}/mark-read/")
    assert res.status_code == status.HTTP_404_NOT_FOUND

    res = client.post(f"/api/notifications/{n1.id}/mark-read/")
    assert res.status_code == status.HTTP_200_OK
    assert res.data["is_read"] is True

    n1.refresh_from_db()
    assert n1.is_read is True
    assert n1.read_at is not None

    count_res = client.get("/api/notifications/unread-count/")
    assert count_res.data["unread_count"] == 1

    res = client.post("/api/notifications/mark-all-read/")
    assert res.status_code == status.HTTP_200_OK
    assert res.data["marked_read"] == 1

    n2.refresh_from_db()
    assert n2.is_read is True

    count_res = client.get("/api/notifications/unread-count/")
    assert count_res.data["unread_count"] == 0


@pytest.mark.django_db
def test_super_admin_notification_endpoints():
    from apps.accounts.authentication import SuperAdminPrincipal

    super_admin = SuperAdminPrincipal(username="9999")
    client = APIClient()
    client.force_authenticate(user=super_admin)

    res = client.get("/api/notifications/unread-count/")
    assert res.status_code == status.HTTP_200_OK
    assert res.data == {"unread_count": 0, "has_unread": False}

    res = client.get("/api/notifications/")
    assert res.status_code == status.HTTP_200_OK
    assert res.data["count"] == 0
    assert res.data["results"] == []

    res = client.post("/api/notifications/999/mark-read/")
    assert res.status_code == status.HTTP_404_NOT_FOUND

    res = client.post("/api/notifications/mark-all-read/")
    assert res.status_code == status.HTTP_200_OK
    assert res.data == {"marked_read": 0}
