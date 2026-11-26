from django.db.models import Count, F, Q, QuerySet

from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal
from apps.projects.models import Project, ProjectAssignment, StepStatus


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

    if status_filter:
        sf = status_filter.strip().upper()
        if sf == "COMPLETED":
            qs = qs.annotate(
                total_steps=Count("steps", distinct=True),
                completed_steps=Count(
                    "steps", filter=Q(steps__status=StepStatus.COMPLETED), distinct=True
                ),
            ).filter(total_steps__gt=0, total_steps=F("completed_steps"))
        elif sf == "ACTIVE":
            qs = qs.annotate(
                total_steps=Count("steps", distinct=True),
                completed_steps=Count(
                    "steps", filter=Q(steps__status=StepStatus.COMPLETED), distinct=True
                ),
            ).filter(Q(total_steps=0) | Q(completed_steps__lt=F("total_steps")))

    return qs.order_by("-created_at")


def get_assignment_matrix(
    *,
    page: int = 1,
    page_size: int = 50,
    employee_search: str = "",
    project_search: str = "",
) -> dict:
    import math

    emp_qs = User.objects.filter(is_active=True, revoked_at__isnull=True)
    if employee_search:
        s = employee_search.strip()
        emp_qs = emp_qs.filter(Q(full_name__icontains=s) | Q(employee_code__icontains=s))
    emp_qs = emp_qs.order_by("employee_code")

    total_employees = emp_qs.count()
    total_pages = math.ceil(total_employees / page_size) if total_employees else 0
    offset = (page - 1) * page_size
    paged_employees = list(emp_qs[offset : offset + page_size])
    paged_emp_ids = [u.id for u in paged_employees]

    proj_qs = Project.objects.filter(is_active=True)
    if project_search:
        ps = project_search.strip()
        proj_qs = proj_qs.filter(Q(name__icontains=ps) | Q(code__icontains=ps))
    projects = list(proj_qs.order_by("code"))
    proj_ids = [p.id for p in projects]

    assignments = ProjectAssignment.objects.filter(
        project_id__in=proj_ids,
        employee_id__in=paged_emp_ids,
    ).values("project_id", "employee_id")

    return {
        "employees": [
            {
                "id": u.id,
                "code": u.employee_code,
                "name": u.full_name,
            }
            for u in paged_employees
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
        "total_employees": total_employees,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
