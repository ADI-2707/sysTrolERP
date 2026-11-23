import secrets
import string
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.accounts.models import User, UserRole
from apps.accounts.principals import SuperAdminPrincipal
from apps.accounts.services import generate_next_employee_code
from apps.audit import services as audit_services

def generate_temporary_password(length: int = 14) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()"
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%^&*()"),
    ]
    password += [secrets.choice(alphabet) for _ in range(length - 4)]
    secrets.SystemRandom().shuffle(password)
    return "".join(password)

def create_employee(
    *,
    email: str,
    full_name: str,
    creator: User | SuperAdminPrincipal,
    phone: str = "",
    designation: str = "",
    department: str = "",
    role: str = UserRole.EMPLOYEE,
    request=None,
) -> tuple[User, str]:
    if role == UserRole.ADMIN and getattr(creator, "role", "") != "SUPER":
        raise PermissionDenied("Only super admin can create administrators.")

    if User.objects.filter(email__iexact=email).exists():
        raise ValidationError({"email": ["An account with this email already exists."]})

    temp_password = generate_temporary_password()

    with transaction.atomic():
        code = generate_next_employee_code()
        user = User.objects.create_user(
            email=email,
            employee_code=code,
            full_name=full_name,
            password=temp_password,
            phone=phone,
            designation=designation,
            department=department,
            role=role,
            must_change_password=True,
            is_active=True,
        )

        audit_services.record(
            action="EMPLOYEE_CREATE",
            actor=creator,
            entity_type="User",
            entity_id=str(user.id),
            summary=f"Created user {user.employee_code} ({user.email}) with role {user.role}",
            changes={
                "employee_code": [None, user.employee_code],
                "email": [None, user.email],
                "role": [None, user.role],
            },
            request=request,
        )

    return user, temp_password

def update_employee(
    *,
    user: User,
    actor: User | SuperAdminPrincipal,
    data: dict,
    request=None,
) -> User:
    new_email = data.get("email")
    if new_email and new_email.lower() != user.email.lower():
        if User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
            raise ValidationError({"email": ["An account with this email already exists."]})

    allowed_fields = ("email", "full_name", "phone", "designation", "department")
    changes = {}
    for field in allowed_fields:
        if field in data:
            old_val = getattr(user, field)
            new_val = data[field]
            if old_val != new_val:
                changes[field] = [old_val, new_val]
                setattr(user, field, new_val)

    if changes:
        user.save(update_fields=list(changes.keys()))
        audit_services.record(
            action="EMPLOYEE_UPDATE",
            actor=actor,
            entity_type="User",
            entity_id=str(user.id),
            summary=f"Updated profile for employee {user.employee_code}",
            changes=changes,
            request=request,
        )

    return user
