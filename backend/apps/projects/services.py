from django.db import models, transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework.exceptions import ValidationError
from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit import services as audit_services
from apps.projects.models import (
    CORE_STEPS,
    STEP_STATUS_ORDER,
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

def update_step_status(
    *,
    step: ProjectStep,
    new_status: str,
    confirm: bool,
    actor: User | SuperAdminPrincipal,
    request=None,
) -> ProjectStep:
    current_order = STEP_STATUS_ORDER.get(step.status, 0)
    new_order = STEP_STATUS_ORDER.get(new_status, 0)

    if new_order <= current_order:
        raise ValidationError({"status": ["Step status can only move forward."]})

    if new_status == StepStatus.COMPLETED and not confirm:
        raise ValidationError({"confirm": ["Confirmation is required to mark a step as completed."]})

    old_status = step.status
    step.status = new_status

    if new_status == StepStatus.COMPLETED:
        step.confirmed_at = timezone.now()
        step.confirmed_by = actor if isinstance(actor, User) else None
        step.confirmed_by_label = (
            f"SUPER:{actor.username}"
            if isinstance(actor, SuperAdminPrincipal)
            else actor.employee_code
        )

    step.save(update_fields=["status", "confirmed_at", "confirmed_by", "confirmed_by_label", "updated_at"])

    audit_services.record(
        action="STEP_STATUS_CHANGE",
        actor=actor,
        entity_type="ProjectStep",
        entity_id=str(step.id),
        summary=f"Changed step {step.name} status to {new_status} in project {step.project.code}",
        changes={"status": [old_status, new_status]},
        request=request,
    )

    return step

def insert_sub_step(
    *,
    project_id: int,
    after_step_id: int,
    name: str,
    actor: User | SuperAdminPrincipal,
    request=None,
) -> ProjectStep:
    with transaction.atomic():
        try:
            project = Project.objects.select_for_update().get(pk=project_id)
        except Project.DoesNotExist:
            raise ValidationError({"project": ["Project not found."]})

        try:
            after_step = project.steps.select_for_update().get(pk=after_step_id)
        except ProjectStep.DoesNotExist:
            raise ValidationError({"after_step_id": ["Target step does not exist in this project."]})

        if after_step.key == "AMC":
            raise ValidationError({"after_step_id": ["Sub-steps cannot be inserted after AMC."]})

        max_completed_pos = (
            project.steps.filter(status=StepStatus.COMPLETED).aggregate(models.Max("position"))["position__max"]
        )
        if max_completed_pos is not None and after_step.position < max_completed_pos:
            raise ValidationError({"after_step_id": ["Sub-steps cannot be inserted before or among completed steps."]})

        custom_count = project.steps.filter(is_custom=True).count()
        if custom_count >= 30:
            raise ValidationError({"non_field_errors": ["Maximum limit of 30 custom sub-steps reached for this project."]})

        shift_steps = list(project.steps.filter(position__gt=after_step.position).order_by("-position"))
        for s in shift_steps:
            s.position = s.position + 1
            s.save(update_fields=["position"])

        new_step = ProjectStep.objects.create(
            project=project,
            name=name,
            position=after_step.position + 1,
            is_custom=True,
            status=StepStatus.NOT_STARTED,
        )

        audit_services.record(
            action="SUB_STEP_CREATE",
            actor=actor,
            entity_type="ProjectStep",
            entity_id=str(new_step.id),
            summary=f"Inserted sub-step {new_step.name} at position {new_step.position} in project {project.code}",
            changes={"name": [None, new_step.name], "position": [None, new_step.position], "after_step_id": [None, after_step.id]},
            request=request,
        )

        return new_step
