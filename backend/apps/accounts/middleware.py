from django.http import JsonResponse
from apps.accounts.principals import SuperAdminPrincipal

class RevocationCheckMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, "user", None)
        if user and user.is_authenticated and not isinstance(user, SuperAdminPrincipal):
            if not user.is_active or user.revoked_at is not None:
                if hasattr(request, "session"):
                    request.session.flush()
                return JsonResponse(
                    {
                        "code": "account_revoked",
                        "message": "User account has been revoked.",
                        "fields": {},
                    },
                    status=401,
                )
        return self.get_response(request)

class MustChangePasswordGateMiddleware:
    ALLOWED_PATHS = {
        "/api/auth/password/change",
        "/api/auth/password/change/",
        "/api/auth/logout",
        "/api/auth/logout/",
        "/api/auth/me",
        "/api/auth/me/",
        "/api/auth/csrf",
        "/api/auth/csrf/",
        "/api/health",
        "/api/health/",
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, "user", None)
        if user and user.is_authenticated and not isinstance(user, SuperAdminPrincipal):
            if getattr(user, "must_change_password", False):
                path = request.path
                if path not in self.ALLOWED_PATHS:
                    return JsonResponse(
                        {
                            "code": "password_change_required",
                            "message": "Password change required before accessing other resources.",
                            "fields": {},
                        },
                        status=403,
                    )
        return self.get_response(request)
