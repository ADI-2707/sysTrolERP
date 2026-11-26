from django.db import connection
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.timezone import company_now


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        now_str = company_now().isoformat()
        db_ok = True
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception:
            db_ok = False

        if db_ok:
            return Response(
                {
                    "status": "healthy",
                    "database": "connected",
                    "timestamp": now_str,
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "status": "unhealthy",
                "database": "disconnected",
                "timestamp": now_str,
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
