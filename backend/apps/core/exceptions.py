import traceback

from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler

from apps.accounts.principals import SuperAdminPrincipal


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        try:
            from apps.telemetry.models import ErrorLog

            request = context.get("request") if context else None
            path = request.path if request else ""
            method = request.method if request else ""
            request_id = getattr(request, "request_id", "") if request else ""
            actor_label = "anonymous"
            if request and hasattr(request, "user") and request.user.is_authenticated:
                if isinstance(request.user, SuperAdminPrincipal):
                    actor_label = f"SUPER:{request.user.username}"
                else:
                    actor_label = getattr(
                        request.user,
                        "employee_code",
                        getattr(request.user, "email", "authenticated"),
                    )

            raw_trace = traceback.format_exc()
            truncated_trace = raw_trace[:10000] if raw_trace else ""

            ErrorLog.objects.create(
                error_class=exc.__class__.__name__,
                message=str(exc)[:1000],
                trace=truncated_trace,
                request_id=request_id,
                path=path,
                method=method,
                actor_label=actor_label,
            )
        except Exception:
            pass

        return Response(
            {
                "code": "server_error",
                "message": "An unexpected error occurred.",
                "fields": {},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    code = getattr(exc, "default_code", "error")
    if isinstance(exc, exceptions.AuthenticationFailed):
        code = "authentication_failed"
        response.status_code = status.HTTP_401_UNAUTHORIZED
        message = str(response.data.get("detail", "Authentication failed."))
        fields = {}
    elif isinstance(exc, exceptions.ValidationError):
        code = "validation_error"
        message = "Validation failed."
        fields = {}
        if isinstance(response.data, dict):
            for key, val in response.data.items():
                if isinstance(val, list):
                    fields[key] = [str(item) for item in val]
                else:
                    fields[key] = [str(val)]
        elif isinstance(response.data, list):
            fields["non_field_errors"] = [str(item) for item in response.data]
        else:
            fields["detail"] = [str(response.data)]
    else:
        fields = {}
        if isinstance(response.data, dict) and "detail" in response.data:
            message = str(response.data["detail"])
        elif isinstance(response.data, str):
            message = response.data
        else:
            message = str(response.data)

    response.data = {
        "code": str(code),
        "message": message,
        "fields": fields,
    }

    return response
