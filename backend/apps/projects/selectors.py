from django.db.models import Q, QuerySet

from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal
from apps.projects.models import Project, ProjectAssignment


def list_projects_for_user(
    user: User | SuperAdminPrincipal,
    *,
    search: str = "",
    status_filter: str = "",
) -> QuerySet[Project]:
    qs = Project.objects.prefetch_related("steps", "assignments__employee")

    is_employee = isinstance(user, User) and user.role == "EMPLOYEE"
    if is_employee:
        qs = qs.filter(is_active=True)

    if search:
        search = search.strip()
        qs = qs.filter(
            Q(name__icontains=search) | Q(code__icontains=search) | Q(client_name__icontains=search)
        )

    return qs.order_by("-created_at")


def get_assignment_matrix() -> dict:
    employees = User.objects.filter(is_active=True).order_by("employee_code")
    projects = Project.objects.filter(is_active=True).order_by("code")
    assignments = ProjectAssignment.objects.filter(
        project__is_active=True,
        employee__is_active=True,
    ).values("project_id", "employee_id")

    return {
        "employees": [
            {
                "id": u.id,
                "code": u.employee_code,
                "name": u.full_name,
            }
            for u in employees
        ],
        "projects": [
            {
                "id": p.id,
                "code": p.code,
                "slug": p.slug,
                "name": p.name,
            }
            for p in projects
        ],
        "assignments": list(assignments),
    }
