from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
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
