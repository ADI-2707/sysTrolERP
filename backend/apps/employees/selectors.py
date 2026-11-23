from django.db.models import Q, QuerySet
from apps.accounts.models import User

def list_employees(*, search: str = "", role: str = "", status: str = "", ordering: str = "employee_code") -> QuerySet[User]:
    qs = User.objects.all()
    if search:
        search = search.strip()
        qs = qs.filter(
            Q(full_name__icontains=search)
            | Q(email__icontains=search)
            | Q(employee_code__icontains=search)
            | Q(designation__icontains=search)
            | Q(department__icontains=search)
        )
    if role:
        qs = qs.filter(role=role)
    if status == "active":
        qs = qs.filter(is_active=True, revoked_at__isnull=True)
    elif status == "revoked":
        qs = qs.filter(Q(is_active=False) | Q(revoked_at__isnull=False))

    valid_orderings = {
        "employee_code", "-employee_code",
        "full_name", "-full_name",
        "email", "-email",
        "date_joined", "-date_joined",
        "last_login", "-last_login",
    }
    if ordering in valid_orderings:
        qs = qs.order_by(ordering)
    else:
        qs = qs.order_by("employee_code")

    return qs

def get_employee_by_id(employee_id: int | str) -> User | None:
    return User.objects.filter(id=employee_id).first()
