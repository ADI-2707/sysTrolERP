from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAuthenticatedPrincipal
from apps.core.pagination import StandardPageNumberPagination
from apps.notifications.models import Notification
from apps.notifications.selectors import get_unread_count, list_notifications
from apps.notifications.serializers import NotificationSerializer


class UnreadNotificationCountView(APIView):
    permission_classes = [IsAuthenticatedPrincipal]

    def get(self, request):
        count = get_unread_count(user=request.user)
        return Response(
            {"unread_count": count, "has_unread": count > 0},
            status=status.HTTP_200_OK,
        )


class NotificationListView(APIView):
    permission_classes = [IsAuthenticatedPrincipal]

    def get(self, request):
        is_read_param = request.query_params.get("is_read")
        is_read = None
        if is_read_param is not None:
            is_read = is_read_param.lower() in ("true", "1")
        category_param = request.query_params.get("category")

        qs = list_notifications(
            user=request.user,
            is_read=is_read,
            category=category_param,
        )
        paginator = StandardPageNumberPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = NotificationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticatedPrincipal]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=["is_read", "read_at", "updated_at"])

        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticatedPrincipal]

    def post(self, request):
        now = timezone.now()
        count = Notification.objects.filter(recipient=request.user, is_read=False).update(
            is_read=True, read_at=now, updated_at=now
        )
        return Response({"marked_read": count}, status=status.HTTP_200_OK)
