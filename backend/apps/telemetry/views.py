from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsAdminOrSuper
from apps.telemetry.pagination import TelemetryCursorPagination
from apps.telemetry.selectors import (
    get_telemetry_summary,
    query_error_logs,
    query_request_logs,
)
from apps.telemetry.serializers import ErrorLogSerializer, RequestLogSerializer

class RequestLogListView(APIView):
    permission_classes = [IsAdminOrSuper]

    def get(self, request):
        qs = query_request_logs(
            user=request.user,
            status_code=request.query_params.get("status_code", ""),
            method=request.query_params.get("method", ""),
            search=request.query_params.get("search", ""),
        )
        paginator = TelemetryCursorPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = RequestLogSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

class ErrorLogListView(APIView):
    permission_classes = [IsAdminOrSuper]

    def get(self, request):
        qs = query_error_logs(
            user=request.user,
            error_class=request.query_params.get("error_class", ""),
            search=request.query_params.get("search", ""),
        )
        paginator = TelemetryCursorPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ErrorLogSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

class TelemetrySummaryView(APIView):
    permission_classes = [IsAdminOrSuper]

    def get(self, request):
        data = get_telemetry_summary()
        return Response(data, status=status.HTTP_200_OK)
