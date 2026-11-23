import datetime
from decimal import Decimal
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal
from apps.core.timezone import company_today, week_bounds
from apps.projects.models import Project
from apps.timesheets.models import Timesheet, TimesheetPolicy
from apps.timesheets.rules import can_edit_week, is_cell_editable

def parse_week_param(week_str: str | None) -> datetime.date:
    if not week_str:
        return company_today()
    try:
        return datetime.date.fromisoformat(week_str.strip())
    except (ValueError, AttributeError):
        raise ValidationError({"week": ["Invalid date format. Use YYYY-MM-DD."]})

def get_own_timesheet(
    user: User | SuperAdminPrincipal,
    week_str: str | None = None,
) -> dict:
    if isinstance(user, SuperAdminPrincipal) or getattr(user, "role", None) == "SUPER":
        raise PermissionDenied("Super admin does not have a personal timesheet.")

    target_date = parse_week_param(week_str)
    monday, sunday = week_bounds(target_date)
    today = company_today()

    timesheet, _ = Timesheet.objects.get_or_create(
        employee=user,
        week_start_date=monday,
    )

    policy = TimesheetPolicy.get_current()

    assigned_projects = list(
        Project.objects.filter(is_active=True, assignments__employee=user).order_by("code")
    )
    assigned_project_ids = {p.id for p in assigned_projects}

    rows = list(
        timesheet.rows.select_related("project").prefetch_related("entries").order_by("created_at")
    )

    week_days = [monday + datetime.timedelta(days=i) for i in range(7)]

    day_totals = {}
    day_regular = {}
    day_overtime = {}

    for d in week_days:
        day_entries = [e for r in rows for e in r.entries.all() if e.date == d]
        day_total = sum((e.hours for e in day_entries), Decimal("0.00"))
        regular = min(day_total, policy.daily_regular_hours)
        overtime = max(Decimal("0.00"), day_total - policy.daily_regular_hours)

        d_str = d.isoformat()
        day_totals[d_str] = str(day_total)
        day_regular[d_str] = str(regular)
        day_overtime[d_str] = str(overtime)

    total_week_hours = sum((Decimal(v) for v in day_totals.values()), Decimal("0.00"))
    total_regular_hours = sum((Decimal(v) for v in day_regular.values()), Decimal("0.00"))
    total_overtime_hours = sum((Decimal(v) for v in day_overtime.values()), Decimal("0.00"))

    rows_data = []
    for r in rows:
        row_entries = []
        row_total = Decimal("0.00")
        is_assigned = r.project_id in assigned_project_ids

        for d in week_days:
            entry = next((e for e in r.entries.all() if e.date == d), None)
            hours_dec = entry.hours if entry else Decimal("0.00")
            row_total += hours_dec

            editable = is_cell_editable(
                cell_date=d,
                week_start_date=monday,
                week_status=timesheet.status,
                project_is_active=r.project.is_active,
                is_assigned=is_assigned,
                today=today,
            )

            row_entries.append({
                "entry_id": entry.id if entry else None,
                "date": d.isoformat(),
                "hours": str(hours_dec),
                "note": entry.note if entry else "",
                "is_editable": editable,
            })

        rows_data.append({
            "id": r.id,
            "project": {
                "id": r.project.id,
                "code": r.project.code,
                "name": r.project.name,
                "slug": r.project.slug,
                "is_active": r.project.is_active,
            },
            "description": r.description,
            "row_total": str(row_total),
            "entries": row_entries,
        })

    return {
        "id": timesheet.id,
        "week_start_date": monday.isoformat(),
        "week_end_date": sunday.isoformat(),
        "status": timesheet.status,
        "can_edit": can_edit_week(week_start_date=monday, status=timesheet.status, today=today),
        "can_submit": timesheet.status in ("OPEN", "RETURNED"),
        "return_reason": timesheet.return_reason,
        "submitted_at": timesheet.submitted_at.isoformat() if timesheet.submitted_at else None,
        "approved_at": timesheet.approved_at.isoformat() if timesheet.approved_at else None,
        "approved_by_label": timesheet.approved_by_label,
        "returned_at": timesheet.returned_at.isoformat() if timesheet.returned_at else None,
        "returned_by_label": timesheet.returned_by_label,
        "policy": {
            "daily_regular_hours": str(policy.daily_regular_hours),
            "hour_step": str(policy.hour_step),
            "break_duration_hours": str(policy.break_duration_hours),
            "overtime_threshold_daily": str(policy.overtime_threshold_daily),
        },
        "days": [d.isoformat() for d in week_days],
        "day_totals": day_totals,
        "day_regular": day_regular,
        "day_overtime": day_overtime,
        "total_week_hours": str(total_week_hours),
        "total_regular_hours": str(total_regular_hours),
        "total_overtime_hours": str(total_overtime_hours),
        "rows": rows_data,
        "assigned_projects": [
            {
                "id": p.id,
                "code": p.code,
                "name": p.name,
                "slug": p.slug,
            }
            for p in assigned_projects
        ],
    }
