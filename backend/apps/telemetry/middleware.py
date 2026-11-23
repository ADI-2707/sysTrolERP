import time
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit.services import get_client_ip_from_meta
from apps.telemetry.models import RequestLog

class RequestLoggingMiddleware:
    EXCLUDED_PREFIXES = ("/static/", "/media/", "/favicon")
    EXCLUDED_EXACT = ("/api/health", "/api/health/")

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        for prefix in self.EXCLUDED_PREFIXES:
            if path.startswith(prefix):
                return self.get_response(request)
        if path in self.EXCLUDED_EXACT:
            return self.get_response(request)

        start_time = time.perf_counter()
        response = self.get_response(request)
        duration_ms = (time.perf_counter() - start_time) * 1000.0

        actor_label = "anonymous"
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            if isinstance(user, SuperAdminPrincipal):
                actor_label = f"SUPER:{user.username}"
            else:
                actor_label = getattr(user, "employee_code", getattr(user, "email", "authenticated"))

        resolver_match = getattr(request, "resolver_match", None)
        route_template = resolver_match.route if resolver_match else path

        response_size = 0
        if hasattr(response, "content"):
            try:
                response_size = len(response.content)
            except Exception:
                pass

        try:
            RequestLog.objects.create(
                method=request.method,
                route_template=route_template,
                path=path,
                status_code=response.status_code,
                duration_ms=round(duration_ms, 2),
                actor_label=actor_label,
                ip_address=get_client_ip_from_meta(request.META),
                response_size_bytes=response_size,
                request_id=getattr(request, "request_id", ""),
            )
        except Exception:
            pass

        return response
