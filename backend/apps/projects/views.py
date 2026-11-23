from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound, PermissionDenied
from apps.accounts.permissions import IsAdminOrSuper, IsAuthenticatedPrincipal
from apps.core.pagination import StandardPageNumberPagination
from apps.projects.models import Project
from apps.projects.selectors import list_projects_for_user
from apps.projects.serializers import (
    ProjectCreateSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
)
from apps.projects.services import create_project

class ProjectListCreateView(APIView):
    permission_classes = [IsAuthenticatedPrincipal]
    pagination_class = StandardPageNumberPagination

    def get(self, request):
        search = request.query_params.get("search", "")
        status_filter = request.query_params.get("status", "")

        qs = list_projects_for_user(
            request.user,
            search=search,
            status_filter=status_filter,
        )

        if status_filter:
            qs = [p for p in qs if p.status == status_filter.upper()]

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = ProjectListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        role = getattr(request.user, "role", "")
        if role not in ("ADMIN", "SUPER"):
            return Response(
                {"code": "permission_denied", "message": "Only admins can create projects.", "fields": {}},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ProjectCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project = create_project(
            creator=request.user,
            request=request,
            **serializer.validated_data,
        )

        resp_serializer = ProjectListSerializer(project)
        return Response(resp_serializer.data, status=status.HTTP_201_CREATED)

class ProjectDetailView(APIView):
    permission_classes = [IsAuthenticatedPrincipal]

    def get(self, request, pk):
        try:
            project = Project.objects.prefetch_related("steps", "assignments__employee").get(pk=pk)
        except Project.DoesNotExist:
            raise NotFound("Project not found.")

        is_employee = getattr(request.user, "role", "") == "EMPLOYEE"
        if is_employee and not project.is_active:
            raise PermissionDenied("Employees can only view active projects.")

        serializer = ProjectDetailSerializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)
