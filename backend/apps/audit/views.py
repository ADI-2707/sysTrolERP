from rest_framework.views import APIView
from apps.accounts.permissions import IsAdminOrSuper
from apps.audit.pagination import AuditCursorPagination
from apps.audit.selectors import query_audit_logs
from apps.audit.serializers import AuditLogSerializer

class AuditLogListView(APIView):
    permission_classes = [IsAdminOrSuper]

    def get(self, request):
        qs = query_audit_logs(
            user=request.user,
            action=request.query_params.get("action", ""),
            actor=request.query_params.get("actor", ""),
            entity_type=request.query_params.get("entity_type", ""),
            entity_id=request.query_params.get("entity_id", ""),
            start_date=request.query_params.get("start_date", ""),
            end_date=request.query_params.get("end_date", ""),
            search=request.query_params.get("search", ""),
        )

        paginator = AuditCursorPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = AuditLogSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
