import datetime
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
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
    TimesheetWeekStatus,
)
from apps.timesheets.rules import can_edit_week, is_cell_editable
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
            is_assigned=True,
            today=today,
        )
        if not editable:
            raise ValidationError({"cell": ["This cell is not editable (past deadline, future day, or locked week)."]})

        row, _ = TimesheetRow.objects.select_for_update().get_or_create(
            timesheet=timesheet,
            project=project,
        )

        old_entry = TimesheetEntry.objects.filter(row=row, date=cell_date).first()

        if hours == Decimal("0.00") and not note.strip():
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

def create_timesheet_row(
    *,
    user: User,
    project_id: int,
    week_date: datetime.date | None = None,
    description: str = "",
    request=None,
) -> dict:
    if isinstance(user, SuperAdminPrincipal) or getattr(user, "role", None) == "SUPER":
        raise PermissionDenied("Super admin cannot have timesheet rows.")

    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        raise ValidationError({"project_id": ["Project not found."]})

    if not project.is_active:
        raise ValidationError({"project_id": ["Cannot add row for inactive project."]})

    if week_date is None:
        week_date = company_today()

    monday, _ = week_bounds(week_date)
    today = company_today()

    with transaction.atomic():
        timesheet, _ = Timesheet.objects.select_for_update().get_or_create(
            employee=user,
            week_start_date=monday,
        )

        if not can_edit_week(week_start_date=monday, status=timesheet.status, today=today):
            raise ValidationError({"week": ["This timesheet week is not editable."]})

        if TimesheetRow.objects.filter(timesheet=timesheet, project=project).exists():
            raise ValidationError({"project_id": ["A row for this project already exists in this timesheet."]})

        row = TimesheetRow.objects.create(
            timesheet=timesheet,
            project=project,
            description=description,
        )

        week_days = [monday + datetime.timedelta(days=i) for i in range(7)]
        row_entries = []
        for d in week_days:
            editable = is_cell_editable(
                cell_date=d,
                week_start_date=monday,
                week_status=timesheet.status,
                project_is_active=True,
                is_assigned=True,
                today=today,
            )
            row_entries.append({
                "entry_id": None,
                "date": d.isoformat(),
                "hours": "0.00",
                "note": "",
                "is_editable": editable,
            })

        return {
            "id": row.id,
            "project": {
                "id": project.id,
                "code": project.code,
                "name": project.name,
                "slug": project.slug,
                "is_active": project.is_active,
            },
            "description": row.description,
            "row_total": "0.00",
            "entries": row_entries,
        }

def delete_timesheet_row(
    *,
    user: User,
    row_id: int,
    request=None,
) -> None:
    if isinstance(user, SuperAdminPrincipal) or getattr(user, "role", None) == "SUPER":
        raise PermissionDenied("Super admin cannot modify timesheet rows.")

    today = company_today()

    with transaction.atomic():
        try:
            row = TimesheetRow.objects.select_related("timesheet").get(pk=row_id, timesheet__employee=user)
        except TimesheetRow.DoesNotExist:
            raise ValidationError({"row_id": ["Timesheet row not found."]})

        timesheet = row.timesheet
        if not can_edit_week(week_start_date=timesheet.week_start_date, status=timesheet.status, today=today):
            raise ValidationError({"week": ["Cannot delete row from a locked or submitted timesheet."]})

        row.delete()

def submit_own_timesheet(
    *,
    user: User,
    week_date: datetime.date | None = None,
    request=None,
) -> dict:
    if isinstance(user, SuperAdminPrincipal) or getattr(user, "role", None) == "SUPER":
        raise PermissionDenied("Super admin cannot submit timesheets.")

    if week_date is None:
        week_date = company_today()

    monday, _ = week_bounds(week_date)

    with transaction.atomic():
        try:
            timesheet = Timesheet.objects.select_for_update().get(
                employee=user,
                week_start_date=monday,
            )
        except Timesheet.DoesNotExist:
            timesheet = Timesheet.objects.create(
                employee=user,
                week_start_date=monday,
            )

        if timesheet.status not in (TimesheetWeekStatus.OPEN, TimesheetWeekStatus.RETURNED):
            raise ValidationError({"status": [f"Cannot submit timesheet with status {timesheet.status}."]})

        old_status = timesheet.status
        timesheet.status = TimesheetWeekStatus.SUBMITTED
        timesheet.submitted_at = timezone.now()
        timesheet.save(update_fields=["status", "submitted_at", "updated_at"])

        audit_services.record(
            action="TIMESHEET_SUBMIT",
            actor=user,
            entity_type="Timesheet",
            entity_id=str(timesheet.id),
            summary=f"Submitted timesheet for week {timesheet.week_start_date}",
            changes={"status": [old_status, TimesheetWeekStatus.SUBMITTED]},
            request=request,
        )

        return get_own_timesheet(user=user, week_str=monday.isoformat())

def close_expired_weeks(*, dry_run: bool = False) -> int:
    today = company_today()
    current_monday, _ = week_bounds(today)
    expired_qs = Timesheet.objects.filter(
        status=TimesheetWeekStatus.OPEN,
        week_start_date__lt=current_monday,
    )
    count = expired_qs.count()

    if not dry_run and count > 0:
        now = timezone.now()
        for ts in expired_qs:
            ts.status = TimesheetWeekStatus.SUBMITTED
            ts.submitted_at = now
            ts.save(update_fields=["status", "submitted_at", "updated_at"])

            audit_services.record(
                action="TIMESHEET_AUTO_SUBMIT",
                actor=None,
                entity_type="Timesheet",
                entity_id=str(ts.id),
                summary=f"Auto-submitted expired timesheet for {ts.employee.employee_code} week {ts.week_start_date}",
                changes={"status": [TimesheetWeekStatus.OPEN, TimesheetWeekStatus.SUBMITTED]},
            )

    return count

def approve_timesheet(
    *,
    timesheet_id: int,
    actor: User | SuperAdminPrincipal,
    request=None,
) -> Timesheet:
    with transaction.atomic():
        try:
            timesheet = Timesheet.objects.select_for_update().get(pk=timesheet_id)
        except Timesheet.DoesNotExist:
            raise ValidationError({"timesheet": ["Timesheet not found."]})

        if timesheet.status != TimesheetWeekStatus.SUBMITTED:
            raise ValidationError({"status": [f"Cannot approve timesheet in status {timesheet.status}."]})

        if isinstance(actor, User) and actor.id == timesheet.employee_id:
            raise ValidationError({"timesheet": ["You cannot approve your own timesheet."]})

        old_status = timesheet.status
        timesheet.status = TimesheetWeekStatus.APPROVED
        timesheet.approved_at = timezone.now()
        timesheet.approved_by = actor if isinstance(actor, User) else None
        timesheet.approved_by_label = (
            f"SUPER:{actor.username}"
            if isinstance(actor, SuperAdminPrincipal)
            else actor.employee_code
        )
        timesheet.returned_at = None
        timesheet.returned_by = None
        timesheet.returned_by_label = ""
        timesheet.return_reason = ""
        timesheet.save(update_fields=[
            "status",
            "approved_at",
            "approved_by",
            "approved_by_label",
            "returned_at",
            "returned_by",
            "returned_by_label",
            "return_reason",
            "updated_at",
        ])

        audit_services.record(
            action="TIMESHEET_APPROVE",
            actor=actor,
            entity_type="Timesheet",
            entity_id=str(timesheet.id),
            summary=f"Approved timesheet {timesheet.id} for {timesheet.employee.employee_code}",
            changes={"status": [old_status, TimesheetWeekStatus.APPROVED]},
            request=request,
        )

        return timesheet

def return_timesheet(
    *,
    timesheet_id: int,
    reason: str,
    actor: User | SuperAdminPrincipal,
    request=None,
) -> Timesheet:
    with transaction.atomic():
        try:
            timesheet = Timesheet.objects.select_for_update().get(pk=timesheet_id)
        except Timesheet.DoesNotExist:
            raise ValidationError({"timesheet": ["Timesheet not found."]})

        if timesheet.status != TimesheetWeekStatus.SUBMITTED:
            raise ValidationError({"status": [f"Cannot return timesheet in status {timesheet.status}."]})

        if isinstance(actor, User) and actor.id == timesheet.employee_id:
            raise ValidationError({"timesheet": ["You cannot return your own timesheet."]})

        old_status = timesheet.status
        timesheet.status = TimesheetWeekStatus.RETURNED
        timesheet.returned_at = timezone.now()
        timesheet.returned_by = actor if isinstance(actor, User) else None
        timesheet.returned_by_label = (
            f"SUPER:{actor.username}"
            if isinstance(actor, SuperAdminPrincipal)
            else actor.employee_code
        )
        timesheet.return_reason = reason
        timesheet.approved_at = None
        timesheet.approved_by = None
        timesheet.approved_by_label = ""
        timesheet.save(update_fields=[
            "status",
            "returned_at",
            "returned_by",
            "returned_by_label",
            "return_reason",
            "approved_at",
            "approved_by",
            "approved_by_label",
            "updated_at",
        ])

        audit_services.record(
            action="TIMESHEET_RETURN",
            actor=actor,
            entity_type="Timesheet",
            entity_id=str(timesheet.id),
            summary=f"Returned timesheet {timesheet.id} for {timesheet.employee.employee_code}: {reason}",
            changes={"status": [old_status, TimesheetWeekStatus.RETURNED], "reason": [None, reason]},
            request=request,
        )

        return timesheet

def override_timesheet_by_super(
    *,
    timesheet_id: int,
    reason: str,
    new_status: str | None = None,
    cells: list[dict] | None = None,
    actor: SuperAdminPrincipal,
    request=None,
) -> Timesheet:
    if not (isinstance(actor, SuperAdminPrincipal) or getattr(actor, "role", None) == "SUPER"):
        raise PermissionDenied("Only super admin can perform timesheet override.")

    with transaction.atomic():
        try:
            timesheet = Timesheet.objects.select_for_update().get(pk=timesheet_id)
        except Timesheet.DoesNotExist:
            raise ValidationError({"timesheet": ["Timesheet not found."]})

        old_status = timesheet.status
        changes = {"reason": [None, reason]}

        if new_status and new_status != timesheet.status:
            timesheet.status = new_status
            changes["status"] = [old_status, new_status]

        monday = timesheet.week_start_date
        sunday = monday + datetime.timedelta(days=6)

        if cells:
            cell_changes = []
            for c in cells:
                cell_date = c["date"]
                if not (monday <= cell_date <= sunday):
                    raise ValidationError({"cells": [f"Date {cell_date} is outside the timesheet week {monday} to {sunday}."]})

                try:
                    project = Project.objects.get(pk=c["project_id"])
                except Project.DoesNotExist:
                    raise ValidationError({"cells": [f"Project {c['project_id']} not found."]})

                row, _ = TimesheetRow.objects.select_for_update().get_or_create(
                    timesheet=timesheet,
                    project=project,
                )

                hours = c["hours"]
                note = c.get("note", "")

                old_entry = TimesheetEntry.objects.filter(row=row, date=cell_date).first()
                old_h = str(old_entry.hours) if old_entry else "0.00"

                if hours == Decimal("0.00"):
                    if old_entry:
                        old_entry.delete()
                else:
                    TimesheetEntry.objects.update_or_create(
                        row=row,
                        date=cell_date,
                        defaults={"hours": hours, "note": note},
                    )

                cell_changes.append({
                    "project_code": project.code,
                    "date": cell_date.isoformat(),
                    "hours": [old_h, str(hours)],
                })

            changes["cells"] = cell_changes

        timesheet.save(update_fields=["status", "updated_at"])

        audit_services.record(
            action="TIMESHEET_SUPER_OVERRIDE",
            actor=actor,
            entity_type="Timesheet",
            entity_id=str(timesheet.id),
            summary=f"Super admin override on timesheet {timesheet.id} ({timesheet.employee.employee_code}): {reason}",
            changes=changes,
            request=request,
            super_only=True,
        )

        return timesheet
