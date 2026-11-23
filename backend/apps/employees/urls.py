from django.urls import path
from apps.employees.views import (
    EmployeeDetailView,
    EmployeeListCreateView,
    EmployeeResetPasswordView,
    EmployeeRestoreView,
    EmployeeRevokeView,
)

urlpatterns = [
    path("", EmployeeListCreateView.as_view(), name="employee_list_create"),
    path("<int:pk>/", EmployeeDetailView.as_view(), name="employee_detail"),
    path("<int:pk>/revoke/", EmployeeRevokeView.as_view(), name="employee_revoke"),
    path("<int:pk>/restore/", EmployeeRestoreView.as_view(), name="employee_restore"),
    path("<int:pk>/reset-password/", EmployeeResetPasswordView.as_view(), name="employee_reset_password"),
]
