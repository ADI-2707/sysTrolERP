from django.urls import path
from apps.timesheets.views import OwnTimesheetView, TimesheetPolicyView

urlpatterns = [
    path("me/", OwnTimesheetView.as_view(), name="own_timesheet"),
    path("policy/", TimesheetPolicyView.as_view(), name="timesheet_policy"),
]
