import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit.models import AuditLog


@pytest.mark.django_db
def test_employee_mutations_and_permissions_audit_edges():
    super_admin = SuperAdminPrincipal("superadmin")
    admin1 = User.objects.create_user(
        email="edge.admin1@example.com",
        employee_code="SYS-0261",
        full_name="Edge Admin 1",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    admin2 = User.objects.create_user(
        email="edge.admin2@example.com",
        employee_code="SYS-0262",
        full_name="Edge Admin 2",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    emp = User.objects.create_user(
        email="edge.emp@example.com",
        employee_code="SYS-0263",
        full_name="Edge Employee",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )

    anon_client = APIClient()
    assert anon_client.get(reverse("employee_list_create")).status_code in (401, 403)
    assert anon_client.post(reverse("employee_list_create"), {}).status_code in (401, 403)

    emp_client = APIClient()
    emp_client.force_authenticate(user=emp)
    assert emp_client.get(reverse("employee_list_create")).status_code == 403
    assert emp_client.get(reverse("employee_detail", kwargs={"pk": emp.id})).status_code == 403
    assert emp_client.post(reverse("employee_revoke", kwargs={"pk": emp.id})).status_code == 403
    assert (
        emp_client.post(reverse("employee_reset_password", kwargs={"pk": emp.id})).status_code
        == 403
    )

    admin1_client = APIClient()
    admin1_client.force_authenticate(user=admin1)

    self_revoke = admin1_client.post(
        reverse("employee_revoke", kwargs={"pk": admin1.id}),
        {"reason": "Attempted self revoke"},
        format="json",
    )
    assert self_revoke.status_code == 403

    admin_revoke_admin = admin1_client.post(
        reverse("employee_revoke", kwargs={"pk": admin2.id}),
        {"reason": "Peer admin revoke attempt"},
        format="json",
    )
    assert admin_revoke_admin.status_code == 403

    admin_reset_admin = admin1_client.post(
        reverse("employee_reset_password", kwargs={"pk": admin2.id}),
        format="json",
    )
    assert admin_reset_admin.status_code == 403

    create_emp_resp = admin1_client.post(
        reverse("employee_list_create"),
        {
            "email": "edge.new@example.com",
            "full_name": "New Edge User",
            "designation": "Technician",
        },
        format="json",
    )
    assert create_emp_resp.status_code == 201
    new_emp_id = create_emp_resp.data["id"]

    create_log = AuditLog.objects.filter(
        action="EMPLOYEE_CREATE", entity_id=str(new_emp_id)
    ).first()
    assert create_log is not None
    assert create_log.actor_user == admin1
    assert create_log.super_only is False

    super_client = APIClient()
    super_client.force_authenticate(user=super_admin)

    super_revoke = super_client.post(
        reverse("employee_revoke", kwargs={"pk": admin2.id}),
        {"reason": "Super admin security revocation"},
        format="json",
    )
    assert super_revoke.status_code == 200

    admin_revoke_log = AuditLog.objects.filter(
        action="EMPLOYEE_REVOKE", entity_id=str(admin2.id)
    ).first()
    assert admin_revoke_log is not None
    assert admin_revoke_log.super_only is True
