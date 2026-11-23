from django.contrib.sessions.models import Session
from django.http import JsonResponse
from django.utils import timezone
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
