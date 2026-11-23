import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.audit.models import AuditLog

@pytest.mark.django_db
def test_update_employee_profile_success():
    admin = User.objects.create_user(
        email="admin.up@example.com",
        employee_code="SYS-0220",
        full_name="Admin Updater",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    user = User.objects.create_user(
        email="emp.up@example.com",
        employee_code="SYS-0221",
        full_name="Emp Before",
        phone="111111",
        designation="Junior Dev",
        department="IT",
        password="ValidPassword123!",
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    payload = {
        "full_name": "Emp After",
        "designation": "Senior Dev",
        "phone": "+919999988888",
    }
    response = client.patch(reverse("employee_detail", kwargs={"pk": user.id}), payload, format="json")
    assert response.status_code == 200
    assert response.data["full_name"] == "Emp After"
    assert response.data["designation"] == "Senior Dev"
    assert response.data["phone"] == "+919999988888"

    user.refresh_from_db()
    assert user.full_name == "Emp After"
    assert user.designation == "Senior Dev"

    audit_log = AuditLog.objects.filter(action="EMPLOYEE_UPDATE", entity_id=str(user.id)).first()
    assert audit_log is not None
    assert "designation" in audit_log.changes

@pytest.mark.django_db
def test_update_employee_duplicate_email():
    admin = User.objects.create_user(
        email="admin.up2@example.com",
        employee_code="SYS-0222",
        full_name="Admin 2",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    user1 = User.objects.create_user(
        email="first@example.com",
        employee_code="SYS-0223",
        full_name="First User",
        password="ValidPassword123!",
    )
    user2 = User.objects.create_user(
        email="second@example.com",
        employee_code="SYS-0224",
        full_name="Second User",
        password="ValidPassword123!",
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    response = client.patch(
        reverse("employee_detail", kwargs={"pk": user2.id}),
        {"email": "first@example.com"},
        format="json",
    )
    assert response.status_code == 400
    assert "email" in response.data["fields"]
