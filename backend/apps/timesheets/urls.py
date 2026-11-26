from django.urls import path

from apps.timesheets.views import (
    AdminPendingTimesheetsView,
    AdminTimesheetListView,
    OwnTimesheetBulkCellsView,
    OwnTimesheetCellView,
    OwnTimesheetHistoryView,
    OwnTimesheetRowDetailView,
    OwnTimesheetRowManageView,
    OwnTimesheetSubmitView,
    OwnTimesheetView,
    SuperAdminTimesheetOverrideView,
    TimesheetApproveView,
    TimesheetPolicyView,
    TimesheetReturnView,
    TimesheetSummaryView,
)

urlpatterns = [
    path("", AdminTimesheetListView.as_view(), name="admin_timesheet_list"),
    path("summary/", TimesheetSummaryView.as_view(), name="timesheet_summary"),
    path("pending/", AdminPendingTimesheetsView.as_view(), name="admin_pending_timesheets"),
    path("<int:pk>/approve/", TimesheetApproveView.as_view(), name="timesheet_approve"),
    path("<int:pk>/return/", TimesheetReturnView.as_view(), name="timesheet_return"),
    path(
        "<int:pk>/override/",
        SuperAdminTimesheetOverrideView.as_view(),
        name="timesheet_super_override",
    ),
    path("me/", OwnTimesheetView.as_view(), name="own_timesheet"),
    path("me/history/", OwnTimesheetHistoryView.as_view(), name="own_timesheet_history"),
    path("me/cells/", OwnTimesheetCellView.as_view(), name="own_timesheet_cells"),
    path("me/cells/bulk/", OwnTimesheetBulkCellsView.as_view(), name="own_timesheet_cells_bulk"),
    path("me/rows/", OwnTimesheetRowManageView.as_view(), name="own_timesheet_rows"),
    path("me/rows/<int:pk>/", OwnTimesheetRowDetailView.as_view(), name="own_timesheet_row_detail"),
    path("me/submit/", OwnTimesheetSubmitView.as_view(), name="own_timesheet_submit"),
    path("policy/", TimesheetPolicyView.as_view(), name="timesheet_policy"),
]
