from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsAuthenticatedPrincipal, IsSuper
from apps.timesheets.models import TimesheetPolicy
from apps.timesheets.selectors import get_own_timesheet
from apps.timesheets.serializers import TimesheetPolicySerializer
from apps.timesheets.services import update_timesheet_policy

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
