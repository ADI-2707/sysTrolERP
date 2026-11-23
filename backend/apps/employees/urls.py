from django.urls import path
from apps.employees.recovery_views import (
    SuperClearLockoutView,
    SuperResetAdminPasswordView,
    SuperRestoreAccountView,
)
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
    path("recovery/reset-admin-password/", SuperResetAdminPasswordView.as_view(), name="super_reset_admin_password"),
    path("recovery/restore-account/", SuperRestoreAccountView.as_view(), name="super_restore_account"),
    path("recovery/clear-lockout/", SuperClearLockoutView.as_view(), name="super_clear_lockout"),
]
