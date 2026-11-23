import datetime
from decimal import Decimal
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit import services as audit_services
from apps.core.timezone import company_today, week_bounds
from apps.projects.models import Project, ProjectAssignment
from apps.timesheets.models import (
    Timesheet,
    TimesheetEntry,
    TimesheetPolicy,
    TimesheetRow,
)
from apps.timesheets.rules import is_cell_editable
from apps.timesheets.selectors import get_own_timesheet

def update_timesheet_policy(
    *,
    data: dict,
    actor: User | SuperAdminPrincipal,
    request=None,
) -> TimesheetPolicy:
    policy = TimesheetPolicy.get_current()
    old_values = {
        "standard_start_time": str(policy.standard_start_time),
        "standard_end_time": str(policy.standard_end_time),
        "break_duration_hours": str(policy.break_duration_hours),
        "daily_regular_hours": str(policy.daily_regular_hours),
        "hour_step": str(policy.hour_step),
        "overtime_threshold_daily": str(policy.overtime_threshold_daily),
    }

    for key, value in data.items():
        if hasattr(policy, key):
            setattr(policy, key, value)

    policy.clean()
    policy.save()

    new_values = {
        "standard_start_time": str(policy.standard_start_time),
        "standard_end_time": str(policy.standard_end_time),
        "break_duration_hours": str(policy.break_duration_hours),
        "daily_regular_hours": str(policy.daily_regular_hours),
        "hour_step": str(policy.hour_step),
        "overtime_threshold_daily": str(policy.overtime_threshold_daily),
    }

    changes = {
        k: [old_values[k], new_values[k]]
        for k in old_values
        if old_values[k] != new_values[k]
    }

    audit_services.record(
        action="TIMESHEET_POLICY_UPDATE",
        actor=actor,
        entity_type="TimesheetPolicy",
        entity_id="1",
        summary="Updated timesheet policy settings",
        changes=changes,
        request=request,
    )

    return policy

def upsert_timesheet_cell(
    *,
    user: User,
    project_id: int,
    cell_date: datetime.date,
    hours: Decimal,
    note: str = "",
    request=None,
) -> dict:
    if isinstance(user, SuperAdminPrincipal) or getattr(user, "role", None) == "SUPER":
        raise PermissionDenied("Super admin cannot record timesheet entries.")

    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        raise ValidationError({"project_id": ["Project not found."]})

    if not project.is_active:
        raise ValidationError({"project_id": ["Cannot enter hours for an inactive project."]})

    is_assigned = ProjectAssignment.objects.filter(project=project, employee=user).exists()
    if not is_assigned:
        raise ValidationError({"project_id": ["You are not assigned to this project."]})

    monday, _ = week_bounds(cell_date)
    today = company_today()

    with transaction.atomic():
        timesheet, _ = Timesheet.objects.select_for_update().get_or_create(
            employee=user,
            week_start_date=monday,
        )

        editable = is_cell_editable(
            cell_date=cell_date,
            week_start_date=monday,
            week_status=timesheet.status,
            project_is_active=project.is_active,
            is_assigned=is_assigned,
            today=today,
        )
        if not editable:
            raise ValidationError({"cell": ["This cell is not editable (past deadline, future day, or locked week)."]})

        row, _ = TimesheetRow.objects.select_for_update().get_or_create(
            timesheet=timesheet,
            project=project,
        )

        old_entry = TimesheetEntry.objects.filter(row=row, date=cell_date).first()

        if hours == Decimal("0.00"):
            if old_entry:
                old_entry.delete()
        else:
            TimesheetEntry.objects.update_or_create(
                row=row,
                date=cell_date,
                defaults={"hours": hours, "note": note},
            )

        row_total = sum((e.hours for e in row.entries.all()), Decimal("0.00"))
        day_total = sum(
            (e.hours for e in TimesheetEntry.objects.filter(row__timesheet=timesheet, date=cell_date)),
            Decimal("0.00"),
        )
        week_total = sum(
            (e.hours for e in TimesheetEntry.objects.filter(row__timesheet=timesheet)),
            Decimal("0.00"),
        )

        return {
            "date": cell_date.isoformat(),
            "hours": str(hours),
            "note": note,
            "row_id": row.id,
            "row_total": str(row_total),
            "day_total": str(day_total),
            "total_week_hours": str(week_total),
        }

def bulk_upsert_timesheet_cells(
    *,
    user: User,
    cells: list[dict],
    request=None,
) -> dict:
    if isinstance(user, SuperAdminPrincipal) or getattr(user, "role", None) == "SUPER":
        raise PermissionDenied("Super admin cannot record timesheet entries.")

    with transaction.atomic():
        updated_dates = set()
        for cell_data in cells:
            upsert_timesheet_cell(
                user=user,
                project_id=cell_data["project_id"],
                cell_date=cell_data["date"],
                hours=cell_data["hours"],
                note=cell_data.get("note", ""),
                request=request,
            )
            updated_dates.add(cell_data["date"])

        first_date = next(iter(updated_dates)) if updated_dates else None
        week_str = first_date.isoformat() if first_date else None
        week_data = get_own_timesheet(user=user, week_str=week_str)

        return {
            "saved_count": len(cells),
            "week": week_data,
        }
