from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsAdminOrSuper
from apps.core.pagination import StandardPageNumberPagination
from rest_framework.exceptions import NotFound
from apps.employees.selectors import get_employee_by_id, list_employees
from apps.employees.serializers import (
    EmployeeCreateSerializer,
    EmployeeCreatedResponseSerializer,
    EmployeeDetailSerializer,
    EmployeeListSerializer,
    EmployeeUpdateSerializer,
    ReasonSerializer,
)
from apps.employees.services import (
    create_employee,
    restore_employee,
    revoke_employee,
    update_employee,
)

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

class EmployeeDetailView(APIView):
    permission_classes = [IsAdminOrSuper]

    def get(self, request, pk):
        user = get_employee_by_id(pk)
        if user is None:
            raise NotFound("Employee not found.")
        serializer = EmployeeDetailSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        user = get_employee_by_id(pk)
        if user is None:
            raise NotFound("Employee not found.")

        serializer = EmployeeUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        updated_user = update_employee(
            user=user,
            actor=request.user,
            data=serializer.validated_data,
            request=request,
        )

        resp_serializer = EmployeeDetailSerializer(updated_user)
        return Response(resp_serializer.data, status=status.HTTP_200_OK)

class EmployeeRevokeView(APIView):
    permission_classes = [IsAdminOrSuper]

    def post(self, request, pk):
        user = get_employee_by_id(pk)
        if user is None:
            raise NotFound("Employee not found.")

        serializer = ReasonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        revoke_employee(
            user=user,
            actor=request.user,
            reason=serializer.validated_data["reason"],
            request=request,
        )

        return Response({"message": "Employee access revoked successfully."}, status=status.HTTP_200_OK)

class EmployeeRestoreView(APIView):
    permission_classes = [IsAdminOrSuper]

    def post(self, request, pk):
        user = get_employee_by_id(pk)
        if user is None:
            raise NotFound("Employee not found.")

        serializer = ReasonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        restore_employee(
            user=user,
            actor=request.user,
            reason=serializer.validated_data["reason"],
            request=request,
        )

        return Response({"message": "Employee access restored successfully."}, status=status.HTTP_200_OK)
