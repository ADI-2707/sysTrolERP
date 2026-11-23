from rest_framework.views import APIView
from apps.accounts.permissions import IsAdminOrSuper
from apps.core.pagination import StandardPageNumberPagination
from apps.employees.selectors import list_employees
from apps.employees.serializers import EmployeeListSerializer

class EmployeeListCreateView(APIView):
    permission_classes = [IsAdminOrSuper]
    pagination_class = StandardPageNumberPagination

    def get(self, request):
        search = request.query_params.get("search", "")
        role = request.query_params.get("role", "")
        status = request.query_params.get("status", "")
        ordering = request.query_params.get("ordering", "employee_code")

        qs = list_employees(
            search=search,
            role=role,
            status=status,
            ordering=ordering,
        )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = EmployeeListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
