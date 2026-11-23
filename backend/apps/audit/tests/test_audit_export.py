import gzip
import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit import services as audit_services

@pytest.mark.django_db
def test_streaming_csv_export():
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
        action="EXPORT_TEST_ACTION",
        actor=admin,
        entity_type="Project",
        entity_id="999",
        summary="Standard audit record for export",
    )
    audit_services.record(
        action="SUPER_SECRET_ACTION",
        actor=super_admin,
        entity_type="System",
        entity_id="root",
        summary="Super admin secret audit record",
        super_only=True,
    )

    client_emp = APIClient()
    client_emp.force_login(emp)
    assert client_emp.get("/api/audit/logs/export/").status_code == 403

    client_admin = APIClient()
    client_admin.force_login(admin)
    res_admin = client_admin.get("/api/audit/logs/export/")
    assert res_admin.status_code == 200
    assert "text/csv" in res_admin["Content-Type"]

    content = b"".join(res_admin.streaming_content).decode("utf-8")
    assert "id,timestamp,actor_kind,actor_label,action" in content
    assert "EXPORT_TEST_ACTION" in content
    assert "SUPER_SECRET_ACTION" not in content

    super_client = APIClient()
    session = super_client.session
    session["is_super_admin"] = True
    session["super_admin_username"] = "superadmin"
    session.save()

    res_super = super_client.get("/api/audit/logs/export/")
    assert res_super.status_code == 200
    super_content = b"".join(res_super.streaming_content).decode("utf-8")
    assert "EXPORT_TEST_ACTION" in super_content
    assert "SUPER_SECRET_ACTION" in super_content

    res_gz = client_admin.get("/api/audit/logs/export/?gzip=true")
    assert res_gz.status_code == 200
    assert "gzip" in res_gz["Content-Encoding"]
    gz_bytes = b"".join(res_gz.streaming_content)
    decompressed = gzip.decompress(gz_bytes).decode("utf-8")
    assert "id,timestamp,actor_kind" in decompressed
    assert "EXPORT_TEST_ACTION" in decompressed
