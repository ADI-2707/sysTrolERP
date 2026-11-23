import pytest
from rest_framework.exceptions import PermissionDenied
from apps.accounts.models import User, UserRole
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit import services as audit_services
from apps.audit.selectors import query_audit_logs

@pytest.mark.django_db
def test_audit_query_and_filtering():
    admin = User.objects.create_user(
        employee_code="SYS-0001",
        email="admin@example.com",
        full_name="Admin One",
        role=UserRole.ADMIN,
        password="ValidPassword123!",
    )
    emp = User.objects.create_user(
        employee_code="SYS-0002",
        email="emp@example.com",
        full_name="Employee Two",
        role=UserRole.EMPLOYEE,
        password="ValidPassword123!",
    )
    super_admin = SuperAdminPrincipal()

    audit_services.record(
        action="LOGIN_SUCCESS",
        actor=admin,
        entity_type="User",
        entity_id=str(admin.id),
        summary="Admin logged in",
    )
    audit_services.record(
        action="PROJECT_CREATE",
        actor=admin,
        entity_type="Project",
        entity_id="101",
        summary="Created project 101",
    )
    audit_services.record(
        action="SUPER_CONFIG_UPDATE",
        actor=super_admin,
        entity_type="Config",
        entity_id="root",
        summary="Super admin changed root credentials",
        super_only=True,
    )

    with pytest.raises(PermissionDenied):
        query_audit_logs(emp)

    admin_logs = list(query_audit_logs(admin))
    assert len(admin_logs) == 2
    assert all(not log.super_only for log in admin_logs)

    super_logs = list(query_audit_logs(super_admin))
    assert len(super_logs) == 3

    by_action = list(query_audit_logs(super_admin, action="PROJECT_CREATE"))
    assert len(by_action) == 1
    assert by_action[0].entity_id == "101"

    by_entity = list(query_audit_logs(super_admin, entity_type="User"))
    assert len(by_entity) == 1
    assert by_entity[0].action == "LOGIN_SUCCESS"

    by_actor = list(query_audit_logs(super_admin, actor="SYS-0001"))
    assert len(by_actor) == 2

    by_search = list(query_audit_logs(super_admin, search="credentials"))
    assert len(by_search) == 1
    assert by_search[0].action == "SUPER_CONFIG_UPDATE"
