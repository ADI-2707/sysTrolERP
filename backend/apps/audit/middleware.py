import uuid

from apps.audit.context import reset_current_request, set_current_request


class RequestIdMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.META.get("HTTP_X_REQUEST_ID")
        if not request_id:
            request_id = uuid.uuid4().hex
        request.request_id = request_id

        token = set_current_request(request)
        try:
            response = self.get_response(request)
        finally:
            reset_current_request(token)

        response["X-Request-ID"] = request_id
        return response
