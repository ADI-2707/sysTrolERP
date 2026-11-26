import csv
import gzip
import io

from django.http import StreamingHttpResponse
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminOrSuper
from apps.audit.pagination import AuditCursorPagination
from apps.audit.selectors import query_audit_logs
from apps.audit.serializers import AuditLogSerializer


class EchoWriter:
    def write(self, value):
        return value


def csv_generator(queryset):
    writer = csv.writer(EchoWriter())
    yield writer.writerow(
        [
            "id",
            "timestamp",
            "actor_kind",
            "actor_label",
            "action",
            "entity_type",
            "entity_id",
            "summary",
            "ip_address",
            "request_id",
        ]
    )
    for log in queryset.iterator(chunk_size=1000):
        yield writer.writerow(
            [
                log.id,
                log.created_at.isoformat(),
                log.actor_kind,
                log.actor_label,
                log.action,
                log.entity_type,
                log.entity_id,
                log.summary,
                log.ip_address or "",
                log.request_id,
            ]
        )


def gzip_compress_generator(generator):
    for chunk in generator:
        if isinstance(chunk, str):
            chunk = chunk.encode("utf-8")
        out = io.BytesIO()
        with gzip.GzipFile(mode="wb", fileobj=out) as gz:
            gz.write(chunk)
        yield out.getvalue()


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


class AuditLogExportView(APIView):
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

        use_gzip = (
            request.query_params.get("gzip", "").lower() in ("true", "1")
            or "gzip" in request.headers.get("Accept-Encoding", "").lower()
        )

        gen = csv_generator(qs)

        if use_gzip:
            response = StreamingHttpResponse(
                gzip_compress_generator(gen),
                content_type="application/gzip",
            )
            response["Content-Encoding"] = "gzip"
            response["Content-Disposition"] = 'attachment; filename="audit_logs.csv.gz"'
        else:
            response = StreamingHttpResponse(
                gen,
                content_type="text/csv; charset=utf-8",
            )
            response["Content-Disposition"] = 'attachment; filename="audit_logs.csv"'

        return response
