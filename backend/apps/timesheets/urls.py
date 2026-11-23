from django.urls import path
from apps.timesheets.views import (
    OwnTimesheetBulkCellsView,
    OwnTimesheetCellView,
    OwnTimesheetView,
    TimesheetPolicyView,
)

urlpatterns = [
    path("me/", OwnTimesheetView.as_view(), name="own_timesheet"),
    path("me/cells/", OwnTimesheetCellView.as_view(), name="own_timesheet_cells"),
    path("me/cells/bulk/", OwnTimesheetBulkCellsView.as_view(), name="own_timesheet_cells_bulk"),
    path("policy/", TimesheetPolicyView.as_view(), name="timesheet_policy"),
]
