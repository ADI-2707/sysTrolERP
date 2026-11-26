import pytest
from django.contrib.auth import login
from django.contrib.sessions.middleware import SessionMiddleware
from django.test import RequestFactory
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed

from apps.accounts.authentication import UnifiedSessionAuthentication
from apps.accounts.models import User, UserRole
from apps.accounts.principals import SuperAdminPrincipal


def add_session_to_request(request):
    middleware = SessionMiddleware(lambda req: None)
    middleware.process_request(request)
    request.session.save()


@pytest.mark.django_db
def test_authenticate_user_session():
    user = User.objects.create_user(
        email="emp@example.com",
        employee_code="SYS-0001",
        full_name="Emp Test",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )
    factory = RequestFactory()
    request = factory.get("/api/auth/me/")
    add_session_to_request(request)
    login(request, user)

    auth = UnifiedSessionAuthentication()
    principal, _ = auth.authenticate(request)
    assert principal == user
    assert principal.role == "EMPLOYEE"


@pytest.mark.django_db
def test_authenticate_super_admin_session(settings):
    settings.SUPER_ADMIN_USERNAME = "superadmin"
    factory = RequestFactory()
    request = factory.get("/api/auth/me/")
    add_session_to_request(request)
    request.session["is_super_admin"] = True
    request.session["super_admin_username"] = "superadmin"
    request.session.save()

    auth = UnifiedSessionAuthentication()
    principal, _ = auth.authenticate(request)
    assert isinstance(principal, SuperAdminPrincipal)
    assert principal.role == "SUPER"
    assert principal.username == "superadmin"


@pytest.mark.django_db
def test_authenticate_revoked_user_session():
    user = User.objects.create_user(
        email="revoked@example.com",
        employee_code="SYS-0002",
        full_name="Revoked User",
        password="ValidPassword123!",
        revoked_at=timezone.now(),
    )
    factory = RequestFactory()
    request = factory.get("/api/auth/me/")
    add_session_to_request(request)
    login(request, user)

    auth = UnifiedSessionAuthentication()
    with pytest.raises(AuthenticationFailed, match="User account is inactive or revoked."):
        auth.authenticate(request)
