from django.urls import path

from apps.audit.views import AuditLogExportView, AuditLogListView

urlpatterns = [
    path("logs/export/", AuditLogExportView.as_view(), name="audit_log_export"),
    path("logs/", AuditLogListView.as_view(), name="audit_log_list"),
]
