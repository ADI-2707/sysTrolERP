from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsAdminOrSuper
from apps.core.pagination import StandardPageNumberPagination
from apps.employees.selectors import list_employees
from apps.employees.serializers import (
    EmployeeCreateSerializer,
    EmployeeCreatedResponseSerializer,
    EmployeeListSerializer,
)
from apps.employees.services import create_employee

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

    def post(self, request):
        serializer = EmployeeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user, temp_password = create_employee(
            creator=request.user,
            request=request,
            **serializer.validated_data,
        )

        resp_serializer = EmployeeCreatedResponseSerializer(user)
        data = dict(resp_serializer.data)
        data["temporary_password"] = temp_password

        return Response(data, status=status.HTTP_201_CREATED)
