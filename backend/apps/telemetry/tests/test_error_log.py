import pytest
from rest_framework import status
from rest_framework.test import APIRequestFactory

from apps.core.exceptions import custom_exception_handler
from apps.telemetry.models import ErrorLog


@pytest.mark.django_db
def test_error_capture_in_exception_handler():
    factory = APIRequestFactory()
    request = factory.get("/api/crash/")
    request.request_id = "err-req-999"

    exc = ZeroDivisionError("division by zero in calculations")
    context = {"request": request, "view": None}

    response = custom_exception_handler(exc, context)
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    assert ErrorLog.objects.count() == 1
    log = ErrorLog.objects.first()
    assert log.error_class == "ZeroDivisionError"
    assert "division by zero" in log.message
    assert log.request_id == "err-req-999"
    assert log.path == "/api/crash/"
