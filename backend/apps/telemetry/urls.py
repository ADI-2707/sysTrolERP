from django.urls import path

from apps.telemetry.views import (
    ErrorLogListView,
    RequestLogListView,
    TelemetrySummaryView,
)

urlpatterns = [
    path("summary/", TelemetrySummaryView.as_view(), name="telemetry_summary"),
    path("requests/", RequestLogListView.as_view(), name="telemetry_requests_list"),
    path("errors/", ErrorLogListView.as_view(), name="telemetry_errors_list"),
]
