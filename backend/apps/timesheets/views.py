from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsAuthenticatedPrincipal, IsSuper
from apps.timesheets.models import TimesheetPolicy
from apps.timesheets.selectors import get_own_timesheet
from apps.timesheets.serializers import (
    BulkCellSaveSerializer,
    CellUpsertSerializer,
    TimesheetPolicySerializer,
    TimesheetRowCreateSerializer,
)
from apps.timesheets.services import (
    bulk_upsert_timesheet_cells,
    create_timesheet_row,
    delete_timesheet_row,
    update_timesheet_policy,
    upsert_timesheet_cell,
)

class TimesheetPolicyView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticatedPrincipal()]
        return [IsSuper()]

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
