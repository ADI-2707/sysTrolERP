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
    skip_reason: str = "",
    request=None,
) -> ProjectStep:
    if step.status in [StepStatus.COMPLETED, StepStatus.SKIPPED]:
        raise ValidationError({"status": ["Completed or skipped steps cannot be modified."]})

    if new_status == step.status:
        raise ValidationError({"status": ["Step status can only move forward."]})

    if new_status == StepStatus.SKIPPED:
        if not confirm:
            raise ValidationError({"confirm": ["Confirmation is required to skip a step."]})
    else:
        current_order = STEP_STATUS_ORDER.get(step.status, 0)
        new_order = STEP_STATUS_ORDER.get(new_status, 0)
        if new_order <= current_order:
            raise ValidationError({"status": ["Step status can only move forward."]})
        if new_status == StepStatus.COMPLETED and not confirm:
            raise ValidationError(
                {"confirm": ["Confirmation is required to mark a step as completed."]}
            )

    closure_keys = {"MOM_AND_HANDOVER", "PAYMENT", "AMC"}
    mom_step = step.project.steps.filter(key="MOM_AND_HANDOVER").first()
    mom_pos = mom_step.position if mom_step else None
    is_closure = (step.key in closure_keys) or (mom_pos is not None and step.position >= mom_pos)

    if is_closure:
        unresolved_prior = step.project.steps.filter(position__lt=step.position).exclude(
            status__in=[StepStatus.COMPLETED, StepStatus.SKIPPED]
        )
        if unresolved_prior.exists():
            first_unresolved = unresolved_prior.order_by("position").first()
            raise ValidationError(
                {
                    "status": [
                        f"Cannot advance '{step.name}'. All prior stages must be Completed or Skipped before entering closure milestones. Unresolved step: '{first_unresolved.name}'."
                    ]
                }
            )
    elif step.position > 1:
        prev_step = step.project.steps.filter(position=step.position - 1).first()
        if prev_step and prev_step.status not in [
            StepStatus.IN_PROGRESS,
            StepStatus.COMPLETED,
            StepStatus.SKIPPED,
        ]:
            raise ValidationError(
                {
                    "status": [
                        f"Cannot advance '{step.name}'. The previous step '{prev_step.name}' must be In Progress, Completed, or Skipped."
                    ]
                }
            )

    old_status = step.status
    step.status = new_status

    if new_status in [StepStatus.COMPLETED, StepStatus.SKIPPED]:
        step.confirmed_at = timezone.now()
        step.confirmed_by = actor if isinstance(actor, User) else None
        step.confirmed_by_label = (
            f"SUPER:{actor.username}"
            if isinstance(actor, SuperAdminPrincipal)
            else actor.employee_code
        )
        if new_status == StepStatus.SKIPPED:
            step.skip_reason = skip_reason.strip()

    step.save(
        update_fields=[
            "status",
            "confirmed_at",
            "confirmed_by",
            "confirmed_by_label",
            "skip_reason",
            "updated_at",
        ]
    )

    action = "STEP_SKIPPED" if new_status == StepStatus.SKIPPED else "STEP_STATUS_CHANGE"
    summary = (
        f"Skipped step {step.name} in project {step.project.code}"
        if new_status == StepStatus.SKIPPED
        else f"Changed step {step.name} status to {new_status} in project {step.project.code}"
    )
    changes = {"status": [old_status, new_status]}
    if new_status == StepStatus.SKIPPED and step.skip_reason:
        changes["skip_reason"] = [None, step.skip_reason]

    audit_services.record(
        action=action,
        actor=actor,
        entity_type="ProjectStep",
        entity_id=str(step.id),
        summary=summary,
        changes=changes,
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
            raise ValidationError(
                {"after_step_id": ["Target step does not exist in this project."]}
            )

        if after_step.key == "AMC":
            raise ValidationError({"after_step_id": ["Sub-steps cannot be inserted after AMC."]})

        max_completed_pos = project.steps.filter(
            status__in=[StepStatus.COMPLETED, StepStatus.SKIPPED]
        ).aggregate(models.Max("position"))["position__max"]
        if max_completed_pos is not None and after_step.position < max_completed_pos:
            raise ValidationError(
                {"after_step_id": ["Sub-steps cannot be inserted before or among completed steps."]}
            )

        custom_count = project.steps.filter(is_custom=True).count()
        if custom_count >= 30:
            raise ValidationError(
                {
                    "non_field_errors": [
                        "Maximum limit of 30 custom sub-steps reached for this project."
                    ]
                }
            )

        shift_steps = list(
            project.steps.filter(position__gt=after_step.position).order_by("-position")
        )
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
            changes={
                "name": [None, new_step.name],
                "position": [None, new_step.position],
                "after_step_id": [None, after_step.id],
            },
            request=request,
        )

        return new_step


def update_custom_step(
    *,
    project_id: int,
    step_id: int,
    name: str,
    actor: User | SuperAdminPrincipal,
    request=None,
) -> ProjectStep:
    try:
        step = ProjectStep.objects.select_related("project").get(pk=step_id, project_id=project_id)
    except ProjectStep.DoesNotExist:
        raise ValidationError({"step": ["Step not found."]})

    if not step.is_custom:
        raise ValidationError({"step": ["Only custom sub-steps can be edited."]})

    if step.status != StepStatus.NOT_STARTED:
        raise ValidationError({"step": ["Only sub-steps in NOT_STARTED status can be edited."]})

    old_name = step.name
    step.name = name
    step.save(update_fields=["name", "updated_at"])

    audit_services.record(
        action="SUB_STEP_UPDATE",
        actor=actor,
        entity_type="ProjectStep",
        entity_id=str(step.id),
        summary=f"Updated sub-step {step.id} name to {step.name} in project {step.project.code}",
        changes={"name": [old_name, step.name]},
        request=request,
    )

    return step


def delete_custom_step(
    *,
    project_id: int,
    step_id: int,
    actor: User | SuperAdminPrincipal,
    request=None,
) -> None:
    with transaction.atomic():
        try:
            project = Project.objects.select_for_update().get(pk=project_id)
        except Project.DoesNotExist:
            raise ValidationError({"project": ["Project not found."]})

        try:
            step = project.steps.select_for_update().get(pk=step_id)
        except ProjectStep.DoesNotExist:
            raise ValidationError({"step": ["Step not found."]})

        if not step.is_custom:
            raise ValidationError({"step": ["Only custom sub-steps can be deleted."]})

        if step.status != StepStatus.NOT_STARTED:
            raise ValidationError(
                {"step": ["Only sub-steps in NOT_STARTED status can be deleted."]}
            )

        deleted_pos = step.position
        deleted_id = step.id
        deleted_name = step.name
        step.delete()

        subsequent_steps = list(project.steps.filter(position__gt=deleted_pos).order_by("position"))
        for s in subsequent_steps:
            s.position = s.position - 1
            s.save(update_fields=["position"])

        audit_services.record(
            action="SUB_STEP_DELETE",
            actor=actor,
            entity_type="ProjectStep",
            entity_id=str(deleted_id),
            summary=f"Deleted sub-step {deleted_name} from project {project.code}",
            changes={
                "id": [deleted_id, None],
                "name": [deleted_name, None],
                "position": [deleted_pos, None],
            },
            request=request,
        )


def add_project_member(
    *,
    project_id: int,
    user_id: int,
    actor: User | SuperAdminPrincipal,
    request=None,
) -> ProjectAssignment:
    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        raise ValidationError({"project": ["Project not found."]})

    try:
        employee = User.objects.get(pk=user_id, is_active=True)
    except User.DoesNotExist:
        raise ValidationError({"user_id": ["Active employee not found."]})

    assigned_by = actor if isinstance(actor, User) else None
    assigned_by_label = (
        f"SUPER:{actor.username}" if isinstance(actor, SuperAdminPrincipal) else actor.employee_code
    )

    assignment, created = ProjectAssignment.objects.get_or_create(
        project=project,
        employee=employee,
        defaults={
            "assigned_by": assigned_by,
            "assigned_by_label": assigned_by_label,
            "assigned_at": timezone.now(),
        },
    )
    if not created:
        raise ValidationError({"user_id": ["Employee is already assigned to this project."]})

    audit_services.record(
        action="PROJECT_MEMBER_ADD",
        actor=actor,
        entity_type="ProjectAssignment",
        entity_id=str(assignment.id),
        summary=f"Assigned {employee.employee_code} to project {project.code}",
        changes={"employee_id": [None, employee.id], "project_id": [None, project.id]},
        request=request,
    )
    return assignment


def remove_project_member(
    *,
    project_id: int,
    user_id: int,
    actor: User | SuperAdminPrincipal,
    request=None,
) -> None:
    try:
        assignment = ProjectAssignment.objects.select_related("project", "employee").get(
            project_id=project_id,
            employee_id=user_id,
        )
    except ProjectAssignment.DoesNotExist:
        raise ValidationError({"user_id": ["Member assignment not found."]})

    assignment_id = assignment.id
    employee_code = assignment.employee.employee_code
    project_code = assignment.project.code
    assignment.delete()

    audit_services.record(
        action="PROJECT_MEMBER_REMOVE",
        actor=actor,
        entity_type="ProjectAssignment",
        entity_id=str(assignment_id),
        summary=f"Removed {employee_code} from project {project_code}",
        changes={"employee_id": [user_id, None], "project_id": [project_id, None]},
        request=request,
    )


def sync_project_members(
    *,
    project_id: int,
    user_ids: list[int],
    actor: User | SuperAdminPrincipal,
    request=None,
) -> list[ProjectAssignment]:
    with transaction.atomic():
        try:
            project = Project.objects.select_for_update().get(pk=project_id)
        except Project.DoesNotExist:
            raise ValidationError({"project": ["Project not found."]})

        unique_ids = list(dict.fromkeys(user_ids))
        valid_users = list(User.objects.filter(id__in=unique_ids, is_active=True))
        if len(valid_users) != len(unique_ids):
            found_ids = {u.id for u in valid_users}
            missing = set(unique_ids) - found_ids
            raise ValidationError(
                {"user_ids": [f"Active users with IDs {sorted(missing)} not found."]}
            )

        current_assignments = {a.employee_id: a for a in project.assignments.all()}
        assigned_by = actor if isinstance(actor, User) else None
        assigned_by_label = (
            f"SUPER:{actor.username}"
            if isinstance(actor, SuperAdminPrincipal)
            else actor.employee_code
        )

        to_remove = [a for uid, a in current_assignments.items() if uid not in unique_ids]
        for a in to_remove:
            a.delete()

        for user in valid_users:
            if user.id not in current_assignments:
                ProjectAssignment.objects.create(
                    project=project,
                    employee=user,
                    assigned_by=assigned_by,
                    assigned_by_label=assigned_by_label,
                    assigned_at=timezone.now(),
                )

        audit_services.record(
            action="PROJECT_MEMBERS_SYNC",
            actor=actor,
            entity_type="Project",
            entity_id=str(project.id),
            summary=f"Synced members for project {project.code}: {unique_ids}",
            changes={"members": [list(current_assignments.keys()), unique_ids]},
            request=request,
        )

        return list(project.assignments.select_related("employee").all())
