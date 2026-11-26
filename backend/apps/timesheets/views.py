from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminOrSuper, IsAuthenticatedPrincipal, IsSuper
from apps.accounts.principals import SuperAdminPrincipal
from apps.core.pagination import StandardPageNumberPagination
from apps.timesheets.models import Timesheet, TimesheetPolicy, TimesheetWeekStatus
from apps.timesheets.selectors import (
    build_timesheet_detail_for_admin,
    get_own_timesheet,
    get_timesheet_dashboard_summary,
    get_timesheet_for_admin,
    list_timesheets_for_admin,
)
from apps.timesheets.serializers import (
    BulkCellSaveSerializer,
    CellUpsertSerializer,
    OwnTimesheetHistorySerializer,
    SuperAdminOverrideSerializer,
    TimesheetAdminListSerializer,
    TimesheetPolicySerializer,
    TimesheetReturnSerializer,
    TimesheetRowCreateSerializer,
    TimesheetSubmitSerializer,
)
from apps.timesheets.services import (
    approve_timesheet,
    bulk_upsert_timesheet_cells,
    create_timesheet_row,
    delete_timesheet_row,
    override_timesheet_by_super,
    return_timesheet,
    submit_own_timesheet,
    update_timesheet_policy,
    upsert_timesheet_cell,
)


class TimesheetPolicyView(APIView):
    permission_classes = [IsSuper]

    def get(self, request):
        policy = TimesheetPolicy.get_current()
        serializer = TimesheetPolicySerializer(policy)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = TimesheetPolicySerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        policy = update_timesheet_policy(
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return Response(TimesheetPolicySerializer(policy).data, status=status.HTTP_200_OK)

    def patch(self, request):
        return self.put(request)


class OwnTimesheetView(APIView):
    permission_classes = [IsAuthenticatedPrincipal]

    def get(self, request):
        week_param = request.query_params.get("week")
        data = get_own_timesheet(user=request.user, week_str=week_param)
        return Response(data, status=status.HTTP_200_OK)


class OwnTimesheetHistoryView(APIView):
    permission_classes = [IsAuthenticatedPrincipal]

    def get(self, request):
        if (
            isinstance(request.user, SuperAdminPrincipal)
            or getattr(request.user, "role", None) == "SUPER"
        ):
            return Response(
                {
                    "count": 0,
                    "next": None,
                    "previous": None,
                    "results": [],
                },
                status=status.HTTP_200_OK,
            )

        qs = (
            Timesheet.objects.filter(employee=request.user)
            .prefetch_related("rows__entries")
            .order_by("-week_start_date")
        )
        paginator = StandardPageNumberPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = OwnTimesheetHistorySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class OwnTimesheetCellView(APIView):
    permission_classes = [IsAuthenticatedPrincipal]

    def put(self, request):
        serializer = CellUpsertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = upsert_timesheet_cell(
            user=request.user,
            project_id=serializer.validated_data["project_id"],
            cell_date=serializer.validated_data["date"],
            hours=serializer.validated_data["hours"],
            note=serializer.validated_data.get("note", ""),
            request=request,
        )
        return Response(result, status=status.HTTP_200_OK)


class OwnTimesheetBulkCellsView(APIView):
    permission_classes = [IsAuthenticatedPrincipal]

    def post(self, request):
        serializer = BulkCellSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = bulk_upsert_timesheet_cells(
            user=request.user,
            cells=serializer.validated_data["cells"],
            request=request,
        )
        return Response(result, status=status.HTTP_200_OK)


class OwnTimesheetRowManageView(APIView):
    permission_classes = [IsAuthenticatedPrincipal]

    def post(self, request):
        serializer = TimesheetRowCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        row_data = create_timesheet_row(
            user=request.user,
            project_id=serializer.validated_data["project_id"],
            week_date=serializer.validated_data.get("week"),
            description=serializer.validated_data.get("description", ""),
            request=request,
        )
        return Response(row_data, status=status.HTTP_201_CREATED)


class OwnTimesheetRowDetailView(APIView):
    permission_classes = [IsAuthenticatedPrincipal]

    def delete(self, request, pk):
        delete_timesheet_row(
            user=request.user,
            row_id=pk,
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class OwnTimesheetSubmitView(APIView):
    permission_classes = [IsAuthenticatedPrincipal]

    def post(self, request):
        serializer = TimesheetSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = submit_own_timesheet(
            user=request.user,
            week_date=serializer.validated_data.get("week"),
            request=request,
        )
        return Response(result, status=status.HTTP_200_OK)


class TimesheetSummaryView(APIView):
    permission_classes = [IsAdminOrSuper]

    def get(self, request):
        week_param = request.query_params.get("week")
        data = get_timesheet_dashboard_summary(week_str=week_param)
        return Response(data, status=status.HTTP_200_OK)


class AdminTimesheetListView(APIView):
    permission_classes = [IsAdminOrSuper]

    def get(self, request):
        employee_param = request.query_params.get("employee")
        week_param = request.query_params.get("week")
        search_param = request.query_params.get("search", "")

        if employee_param and week_param and not search_param:
            data = get_timesheet_for_admin(
                employee_param=employee_param,
                week_param=week_param,
                current_user=request.user,
            )
            return Response(data, status=status.HTTP_200_OK)

        qs = list_timesheets_for_admin(
            employee_filter=employee_param or "",
            week_filter=week_param or "",
            status_filter=request.query_params.get("status", ""),
            search=search_param,
        )
        paginator = StandardPageNumberPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = TimesheetAdminListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class AdminPendingTimesheetsView(APIView):
    permission_classes = [IsAdminOrSuper]

    def get(self, request):
        qs = (
            Timesheet.objects.filter(status=TimesheetWeekStatus.SUBMITTED)
            .select_related("employee")
            .prefetch_related("rows__entries")
            .order_by("submitted_at")
        )
        paginator = StandardPageNumberPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = TimesheetAdminListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


class TimesheetApproveView(APIView):
    permission_classes = [IsAdminOrSuper]

    def post(self, request, pk):
        timesheet = approve_timesheet(
            timesheet_id=pk,
            actor=request.user,
            request=request,
        )
        data = build_timesheet_detail_for_admin(timesheet, current_user=request.user)
        return Response(data, status=status.HTTP_200_OK)


class TimesheetReturnView(APIView):
    permission_classes = [IsAdminOrSuper]

    def post(self, request, pk):
        serializer = TimesheetReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        timesheet = return_timesheet(
            timesheet_id=pk,
            reason=serializer.validated_data["reason"],
            actor=request.user,
            request=request,
        )
        data = build_timesheet_detail_for_admin(timesheet, current_user=request.user)
        return Response(data, status=status.HTTP_200_OK)


class SuperAdminTimesheetOverrideView(APIView):
    permission_classes = [IsSuper]

    def put(self, request, pk):
        serializer = SuperAdminOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        timesheet = override_timesheet_by_super(
            timesheet_id=pk,
            reason=serializer.validated_data["reason"],
            new_status=serializer.validated_data.get("status"),
            cells=serializer.validated_data.get("cells"),
            actor=request.user,
            request=request,
        )
        data = build_timesheet_detail_for_admin(timesheet, current_user=request.user)
        return Response(data, status=status.HTTP_200_OK)
