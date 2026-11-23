import datetime
from decimal import Decimal
from django.db.models import Q
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal
from apps.core.timezone import company_today, week_bounds
from apps.projects.models import Project
from apps.timesheets.models import Timesheet, TimesheetPolicy, TimesheetWeekStatus
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

def build_timesheet_detail_for_admin(
    timesheet: Timesheet,
    current_user: User | SuperAdminPrincipal,
) -> dict:
    today = company_today()
    monday = timesheet.week_start_date
    sunday = monday + datetime.timedelta(days=6)
    policy = TimesheetPolicy.get_current()

    assigned_projects = list(
        Project.objects.filter(is_active=True, assignments__employee=timesheet.employee).order_by("code")
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

    is_super = isinstance(current_user, SuperAdminPrincipal) or getattr(current_user, "role", None) == "SUPER"
    is_own = isinstance(current_user, User) and current_user.id == timesheet.employee_id
    can_authorize = timesheet.status == TimesheetWeekStatus.SUBMITTED and (is_super or not is_own)

    return {
        "id": timesheet.id,
        "employee": {
            "id": timesheet.employee.id,
            "code": timesheet.employee.employee_code,
            "name": timesheet.employee.full_name,
            "designation": timesheet.employee.designation,
            "department": timesheet.employee.department,
        },
        "week_start_date": monday.isoformat(),
        "week_end_date": sunday.isoformat(),
        "status": timesheet.status,
        "can_approve": can_authorize,
        "can_return": can_authorize,
        "can_override": is_super,
        "return_reason": timesheet.return_reason,
        "submitted_at": timesheet.submitted_at.isoformat() if timesheet.submitted_at else None,
        "approved_at": timesheet.approved_at.isoformat() if timesheet.approved_at else None,
        "approved_by_label": timesheet.approved_by_label,
        "returned_at": timesheet.returned_at.isoformat() if timesheet.returned_at else None,
        "returned_by_label": timesheet.returned_by_label,
        "days": [d.isoformat() for d in week_days],
        "day_totals": day_totals,
        "day_regular": day_regular,
        "day_overtime": day_overtime,
        "total_week_hours": str(total_week_hours),
        "total_regular_hours": str(total_regular_hours),
        "total_overtime_hours": str(total_overtime_hours),
        "rows": rows_data,
    }

def get_timesheet_for_admin(
    *,
    employee_param: str,
    week_param: str,
    current_user: User | SuperAdminPrincipal,
) -> dict:
    target_date = parse_week_param(week_param)
    monday, _ = week_bounds(target_date)

    if employee_param.isdigit():
        user = User.objects.filter(pk=int(employee_param)).first()
    else:
        user = User.objects.filter(employee_code=employee_param.strip()).first()

    if not user:
        raise NotFound("Employee not found.")

    timesheet = Timesheet.objects.filter(
        employee=user,
        week_start_date=monday,
    ).first()

    if not timesheet:
        timesheet, _ = Timesheet.objects.get_or_create(
            employee=user,
            week_start_date=monday,
        )

    return build_timesheet_detail_for_admin(timesheet, current_user=current_user)

def list_timesheets_for_admin(
    *,
    employee_filter: str = "",
    week_filter: str = "",
    status_filter: str = "",
):
    qs = Timesheet.objects.select_related("employee").prefetch_related("rows__entries").order_by("-week_start_date", "employee__employee_code")

    if employee_filter:
        val = employee_filter.strip()
        if val.isdigit():
            qs = qs.filter(Q(employee_id=int(val)) | Q(employee__employee_code=val))
        else:
            qs = qs.filter(Q(employee__employee_code__icontains=val) | Q(employee__full_name__icontains=val))

    if week_filter:
        target_date = parse_week_param(week_filter)
        monday, _ = week_bounds(target_date)
        qs = qs.filter(week_start_date=monday)

    if status_filter:
        status_val = status_filter.strip().upper()
        if status_val in TimesheetWeekStatus.values:
            qs = qs.filter(status=status_val)

    return qs

def get_timesheet_dashboard_summary(week_str: str | None = None) -> dict:
    target_date = parse_week_param(week_str)
    monday, sunday = week_bounds(target_date)

    policy = TimesheetPolicy.get_current()
    active_employees_count = User.objects.filter(is_active=True).count()

    week_timesheets = list(
        Timesheet.objects.filter(week_start_date=monday)
        .select_related("employee")
        .prefetch_related("rows__entries")
    )

    submitted_count = sum(1 for ts in week_timesheets if ts.status == TimesheetWeekStatus.SUBMITTED)
    approved_count = sum(1 for ts in week_timesheets if ts.status == TimesheetWeekStatus.APPROVED)
    open_count = sum(1 for ts in week_timesheets if ts.status == TimesheetWeekStatus.OPEN)
    returned_count = sum(1 for ts in week_timesheets if ts.status == TimesheetWeekStatus.RETURNED)

    all_pending_count = Timesheet.objects.filter(status=TimesheetWeekStatus.SUBMITTED).count()

    week_days = [monday + datetime.timedelta(days=i) for i in range(7)]

    total_hours = Decimal("0.00")
    total_regular = Decimal("0.00")
    total_overtime = Decimal("0.00")

    for ts in week_timesheets:
        for d in week_days:
            day_hours = sum(
                (e.hours for r in ts.rows.all() for e in r.entries.all() if e.date == d),
                Decimal("0.00"),
            )
            reg = min(day_hours, policy.daily_regular_hours)
            ot = max(Decimal("0.00"), day_hours - policy.daily_regular_hours)
            total_hours += day_hours
            total_regular += reg
            total_overtime += ot

    return {
        "week_start_date": monday.isoformat(),
        "week_end_date": sunday.isoformat(),
        "active_employees_count": active_employees_count,
        "pending_approval_count": all_pending_count,
        "week_submitted_count": submitted_count,
        "week_approved_count": approved_count,
        "week_open_count": open_count,
        "week_returned_count": returned_count,
        "total_hours": str(total_hours),
        "total_regular_hours": str(total_regular),
        "total_overtime_hours": str(total_overtime),
    }
