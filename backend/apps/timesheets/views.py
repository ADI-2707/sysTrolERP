from datetime import date, timedelta

from django.http import HttpResponse
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminOrSuper, IsAuthenticatedPrincipal, IsSuper
from apps.accounts.principals import SuperAdminPrincipal
from apps.core.pagination import StandardPageNumberPagination
from apps.projects.models import Project
from apps.timesheets.models import Timesheet, TimesheetPolicy, TimesheetWeekStatus
from apps.timesheets.reports.excel_generator import generate_site_diary_excel
from apps.timesheets.reports.pdf_generator import generate_site_diary_pdf
from apps.timesheets.selectors import (
    build_timesheet_detail_for_admin,
    get_own_timesheet,
    get_site_diary_range_data,
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
        client_tz = request.headers.get("X-Client-Timezone") or request.query_params.get(
            "client_timezone"
        )
        data = get_own_timesheet(user=request.user, week_str=week_param, client_tz=client_tz)
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
        department_param = request.query_params.get("department", "")
        project_param = request.query_params.get("project_id", "")
        all_pending_param = request.query_params.get("all_pending", "").lower() in ("true", "1")

        if employee_param and week_param and not search_param and not all_pending_param:
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
            department=department_param,
            project_id=project_param or None,
            all_pending=all_pending_param,
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


class SiteDiaryExportView(APIView):
    permission_classes = [IsAuthenticatedPrincipal]

    def perform_content_negotiation(self, request, force=False):
        renderers = self.get_renderers()
        return (renderers[0], renderers[0].media_type)

    def get(self, request, timesheet_id=None):
        start_date_param = request.query_params.get("start_date")
        end_date_param = request.query_params.get("end_date")
        project_id_param = request.query_params.get("project_id")
        format_type = request.query_params.get("format", "pdf").lower()

        if start_date_param or end_date_param:
            if not start_date_param or not end_date_param:
                raise ValidationError(
                    {"date_range": ["Both start_date and end_date query parameters are required."]}
                )

            try:
                start_date = date.fromisoformat(start_date_param.strip())
                end_date = date.fromisoformat(end_date_param.strip())
            except (ValueError, AttributeError):
                raise ValidationError(
                    {
                        "date_range": [
                            "Invalid date format. Use YYYY-MM-DD for start_date and end_date."
                        ]
                    }
                )

            if not project_id_param:
                raise ValidationError({"project_id": ["project_id query parameter is required."]})

            try:
                project_id = int(project_id_param)
            except (ValueError, TypeError):
                raise ValidationError({"project_id": ["Invalid project_id."]})

            employee_id_param = request.query_params.get("employee_id")
            role = getattr(request.user, "role", "")
            if employee_id_param and role in ("ADMIN", "SUPER"):
                try:
                    target_employee_id = int(employee_id_param)
                except (ValueError, TypeError):
                    raise ValidationError({"employee_id": ["Invalid employee_id."]})
            else:
                target_employee_id = request.user.id

            range_data = get_site_diary_range_data(
                employee_id=target_employee_id,
                project_id=project_id,
                start_date=start_date,
                end_date=end_date,
            )

            if not range_data["has_entries"]:
                raise ValidationError(
                    {
                        "project_id": [
                            "No recorded entries for this project in the selected date range."
                        ]
                    }
                )

            project = range_data["project"]
            engineer = range_data["employee"]

            if format_type in ("excel", "xlsx"):
                content = generate_site_diary_excel(range_data=range_data)
                content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                filename = f"Site_Diary_{project.code}_{engineer.employee_code}_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}.xlsx"
            else:
                content = generate_site_diary_pdf(range_data=range_data)
                content_type = "application/pdf"
                filename = f"Site_Diary_{project.code}_{engineer.employee_code}_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}.pdf"

            resp = HttpResponse(content, content_type=content_type)
            resp["Content-Disposition"] = f'attachment; filename="{filename}"'
            return resp

        ts_id = timesheet_id or request.query_params.get("timesheet_id")
        if not ts_id:
            raise ValidationError(
                {
                    "timesheet_id": [
                        "Either timesheet_id or both start_date and end_date must be provided."
                    ]
                }
            )

        try:
            timesheet = (
                Timesheet.objects.select_related("employee")
                .prefetch_related("rows__entries", "rows__project")
                .get(pk=ts_id)
            )
        except (ValueError, Timesheet.DoesNotExist):
            raise NotFound("Timesheet not found.")

        role = getattr(request.user, "role", "")
        if role == "EMPLOYEE" and timesheet.employee_id != request.user.id:
            raise PermissionDenied("You can only export your own site diary.")

        if not project_id_param:
            raise ValidationError({"project_id": ["project_id query parameter is required."]})

        try:
            project_id = int(project_id_param)
            project = Project.objects.prefetch_related("steps").get(pk=project_id)
        except (ValueError, Project.DoesNotExist):
            raise NotFound("Project not found.")

        project_rows = [r for r in timesheet.rows.all() if r.project_id == project.id]
        if not project_rows:
            raise ValidationError(
                {"project_id": ["No recorded entries for this project in the selected timesheet."]}
            )

        monday = timesheet.week_start_date
        week_days = [monday + timedelta(days=i) for i in range(7)]
        policy = TimesheetPolicy.get_current()

        if format_type in ("excel", "xlsx"):
            content = generate_site_diary_excel(
                timesheet=timesheet,
                project=project,
                rows=project_rows,
                week_days=week_days,
                policy=policy,
            )
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"Site_Diary_{project.code}_{timesheet.employee.employee_code}_{monday.strftime('%Y%m%d')}.xlsx"
        else:
            content = generate_site_diary_pdf(
                timesheet=timesheet,
                project=project,
                rows=project_rows,
                week_days=week_days,
                policy=policy,
            )
            content_type = "application/pdf"
            filename = f"Site_Diary_{project.code}_{timesheet.employee.employee_code}_{monday.strftime('%Y%m%d')}.pdf"

        resp = HttpResponse(content, content_type=content_type)
        resp["Content-Disposition"] = f'attachment; filename="{filename}"'
        return resp
