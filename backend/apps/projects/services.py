from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework.exceptions import ValidationError
from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit import services as audit_services
from apps.projects.models import (
    CORE_STEPS,
    Project,
    ProjectAssignment,
    ProjectCodeSequence,
    ProjectStep,
    StepStatus,
)

def generate_next_project_code(year: int | None = None) -> str:
    if year is None:
        year = timezone.now().year

    with transaction.atomic():
        seq, _ = ProjectCodeSequence.objects.select_for_update().get_or_create(
            year=year,
            defaults={"last_number": 0},
        )
        seq.last_number += 1
        seq.save(update_fields=["last_number"])
        return f"PRJ-{year}-{seq.last_number:03d}"

def generate_unique_project_slug(name: str) -> str:
    base_slug = slugify(name)
    if not base_slug:
        base_slug = "project"

    slug = base_slug
    counter = 1
    while Project.objects.filter(slug=slug).exists():
        counter += 1
        slug = f"{base_slug}-{counter}"

    return slug

def create_project(
    *,
    name: str,
    creator: User | SuperAdminPrincipal,
    client_name: str = "",
    description: str = "",
    member_ids: list[int] | None = None,
    request=None,
) -> Project:
    name = name.strip()
    if not name:
        raise ValidationError({"name": ["Project name is required."]})

    created_by = creator if isinstance(creator, User) else None
    created_by_label = (
        f"SUPER:{creator.username}"
        if isinstance(creator, SuperAdminPrincipal)
        else creator.employee_code
    )

    with transaction.atomic():
        code = generate_next_project_code()
        slug = generate_unique_project_slug(name)

        project = Project.objects.create(
            code=code,
            name=name,
            slug=slug,
            client_name=client_name.strip(),
            description=description.strip(),
            created_by=created_by,
            created_by_label=created_by_label,
            is_active=True,
        )

        steps_to_create = [
            ProjectStep(
                project=project,
                key=step_key,
                name=step_name,
                position=index,
                is_custom=False,
                status=StepStatus.NOT_STARTED,
            )
            for index, (step_key, step_name) in enumerate(CORE_STEPS, start=1)
        ]
        ProjectStep.objects.bulk_create(steps_to_create)

        if member_ids:
            valid_users = list(User.objects.filter(id__in=set(member_ids), is_active=True))
            assignments = [
                ProjectAssignment(
                    project=project,
                    employee=u,
                    assigned_by=created_by,
                    assigned_by_label=created_by_label,
                )
                for u in valid_users
            ]
            ProjectAssignment.objects.bulk_create(assignments)

        audit_services.record(
            action="PROJECT_CREATE",
            actor=creator,
            entity_type="Project",
            entity_id=str(project.id),
            summary=f"Created project {project.code} ({project.name}) with 14 seeded steps",
            changes={"code": [None, project.code], "name": [None, project.name]},
            request=request,
        )

    return project
