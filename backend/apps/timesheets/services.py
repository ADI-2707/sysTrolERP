from apps.accounts.models import User
from apps.accounts.principals import SuperAdminPrincipal
from apps.audit import services as audit_services
from apps.timesheets.models import TimesheetPolicy

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
