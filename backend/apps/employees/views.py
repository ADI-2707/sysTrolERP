from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsAdminOrSuper

class EmployeeListCreateView(APIView):
    permission_classes = [IsAdminOrSuper]

    def get(self, request):
        return Response({"results": []})
