from django.conf import settings


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        csp = getattr(
            settings,
            "CONTENT_SECURITY_POLICY",
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';",
        )
        if csp and "Content-Security-Policy" not in response:
            response["Content-Security-Policy"] = csp

        permissions_policy = getattr(
            settings,
            "PERMISSIONS_POLICY",
            "camera=(), microphone=(), geolocation=(), payment=()",
        )
        if permissions_policy and "Permissions-Policy" not in response:
            response["Permissions-Policy"] = permissions_policy

        return response
