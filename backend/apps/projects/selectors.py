from django.db.models import Count, Q, QuerySet
from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal
from apps.projects.models import Project, StepStatus

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
            Q(name__icontains=search)
            | Q(code__icontains=search)
            | Q(client_name__icontains=search)
        )

    return qs.order_by("-created_at")
