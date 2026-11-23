from django.urls import path
from apps.timesheets.views import TimesheetPolicyView

urlpatterns = [
    path("policy/", TimesheetPolicyView.as_view(), name="timesheet_policy"),
]
