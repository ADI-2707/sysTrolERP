import datetime
import pytest
from rest_framework.test import APIClient
import time_machine
from apps.accounts.models import User, UserRole
from apps.telemetry.models import ErrorLog, RequestLog

@pytest.mark.django_db
def test_telemetry_summary_endpoint():
    with time_machine.travel("2026-11-25 12:00:00+05:30"):
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

        now = datetime.datetime(2026, 11, 25, 12, 0, 0, tzinfo=datetime.timezone(datetime.timedelta(hours=5, minutes=30)))

        for d in [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0]:
            RequestLog.objects.create(
                method="GET",
                route_template="api/test/",
                path="/api/test/",
                status_code=200,
                duration_ms=d,
                created_at=now - datetime.timedelta(minutes=15),
            )

        ErrorLog.objects.create(
            error_class="ValueError",
            message="Test error",
            created_at=now - datetime.timedelta(minutes=10),
        )

        RequestLog.objects.create(
            method="GET",
            route_template="api/test/",
            path="/api/test/",
            status_code=200,
            duration_ms=200.0,
            created_at=now - datetime.timedelta(hours=5),
        )

        client_emp = APIClient()
        client_emp.force_login(emp)
        assert client_emp.get("/api/telemetry/summary/").status_code == 403

        client_admin = APIClient()
        client_admin.force_login(admin)
        res = client_admin.get("/api/telemetry/summary/")
        assert res.status_code == 200
        data = res.json()

        assert "1h" in data
        assert "24h" in data
        assert "7d" in data

        assert data["1h"]["total_requests"] >= 10
        assert data["1h"]["error_count"] == 1
        assert data["24h"]["total_requests"] >= 11
        assert data["24h"]["error_count"] == 1
