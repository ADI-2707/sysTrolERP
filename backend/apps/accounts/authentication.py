from django.conf import settings
from django.contrib.auth import get_user
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import AuthenticationFailed

from apps.accounts.principals import SuperAdminPrincipal


class UnifiedSessionAuthentication(SessionAuthentication):
    def authenticate(self, request):
        http_request = getattr(request, "_request", request)
        if hasattr(http_request, "session"):
            if http_request.session.get("is_super_admin"):
                username = http_request.session.get("super_admin_username")
                configured_username = getattr(settings, "SUPER_ADMIN_USERNAME", "superadmin")
                if username and username.lower() in (
                    configured_username.lower(),
                    "superadmin",
                    "9999",
                ):
                    if hasattr(request, "_request"):
                        self.enforce_csrf(request)
                    return (SuperAdminPrincipal(username=username), None)
                http_request.session.flush()
                return None

            user = getattr(http_request, "user", None)
            if user is None or not user.is_authenticated:
                user = get_user(http_request)

            if user and user.is_authenticated:
                if not user.is_active or user.revoked_at is not None:
                    raise AuthenticationFailed("User account is inactive or revoked.")
                if hasattr(request, "_request"):
                    self.enforce_csrf(request)
                return (user, None)

        return None
