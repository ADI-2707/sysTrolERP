import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.telemetry.models import ErrorLog, RequestLog


@pytest.mark.django_db
def test_telemetry_endpoints():
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

    RequestLog.objects.create(
        method="POST",
        route_template="api/auth/login/",
        path="/api/auth/login/",
        status_code=200,
        duration_ms=45.2,
        actor_label="SYS-0001",
        ip_address="127.0.0.1",
        request_id="req-123",
    )
    RequestLog.objects.create(
        method="GET",
        route_template="api/employees/",
        path="/api/employees/",
        status_code=403,
        duration_ms=12.1,
        actor_label="SYS-0002",
        ip_address="127.0.0.1",
        request_id="req-456",
    )

    ErrorLog.objects.create(
        error_class="ValidationError",
        message="Invalid password supplied",
        request_id="req-789",
        path="/api/auth/password/change/",
        method="POST",
        actor_label="SYS-0002",
    )

    client_emp = APIClient()
    client_emp.force_login(emp)

    assert client_emp.get("/api/telemetry/requests/").status_code == 403
    assert client_emp.get("/api/telemetry/errors/").status_code == 403

    client_admin = APIClient()
    client_admin.force_login(admin)

    res_req = client_admin.get("/api/telemetry/requests/")
    assert res_req.status_code == 200
    assert "results" in res_req.json()
    assert len(res_req.json()["results"]) >= 2

    res_filtered_req = client_admin.get("/api/telemetry/requests/?status_code=403")
    assert res_filtered_req.status_code == 200
    assert all(r["status_code"] == 403 for r in res_filtered_req.json()["results"])

    res_err = client_admin.get("/api/telemetry/errors/")
    assert res_err.status_code == 200
    assert "results" in res_err.json()
    assert any(e["error_class"] == "ValidationError" for e in res_err.json()["results"])

    res_date_req = client_admin.get(
        "/api/telemetry/requests/?start_date=2020-01-01&end_date=2030-01-01"
    )
    assert res_date_req.status_code == 200
    assert len(res_date_req.json()["results"]) >= 2

    res_past_req = client_admin.get(
        "/api/telemetry/requests/?start_date=2010-01-01&end_date=2010-01-02"
    )
    assert res_past_req.status_code == 200
    assert len(res_past_req.json()["results"]) == 0

    res_class_req = client_admin.get("/api/telemetry/requests/?status_class=4xx")
    assert res_class_req.status_code == 200
    assert all(400 <= r["status_code"] < 500 for r in res_class_req.json()["results"])

    res_dur_req = client_admin.get("/api/telemetry/requests/?min_duration_ms=40")
    assert res_dur_req.status_code == 200
    assert all(r["duration_ms"] >= 40 for r in res_dur_req.json()["results"])

    res_date_err = client_admin.get(
        "/api/telemetry/errors/?start_date=2020-01-01&end_date=2030-01-01"
    )
    assert res_date_err.status_code == 200
    assert len(res_date_err.json()["results"]) >= 1

    res_past_err = client_admin.get(
        "/api/telemetry/errors/?start_date=2010-01-01&end_date=2010-01-02"
    )
    assert res_past_err.status_code == 200
    assert len(res_past_err.json()["results"]) == 0
