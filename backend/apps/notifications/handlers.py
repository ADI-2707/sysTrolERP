from typing import Any

from apps.accounts.models import User, UserRole
from apps.notifications.events import (
    TimesheetApprovedEvent,
    TimesheetReturnedEvent,
    TimesheetSubmittedEvent,
)
from apps.notifications.models import NotificationCategory, NotificationPriority
from apps.notifications.services import bulk_create_notifications, create_notification


def handle_timesheet_submitted(event: TimesheetSubmittedEvent) -> None:
    approvers = User.objects.filter(role=UserRole.ADMIN, is_active=True).exclude(
        id=event.employee_id
    )

    records = [
        {
            "recipient": approver,
            "actor": User.objects.filter(id=event.employee_id).first(),
            "actor_label": event.employee_code,
            "event_type": "TIMESHEET_SUBMITTED",
            "category": NotificationCategory.TIMESHEET,
            "priority": NotificationPriority.NORMAL,
            "title": "Timesheet Pending Approval",
            "body": f"Timesheet for week {event.week_start_date} submitted by {event.employee_name} ({event.employee_code}) has been sent to you to approve.",
            "action_url": f"/timesheets?week={event.week_start_date}&employee={event.employee_code}",
            "metadata": {
                "timesheet_id": event.timesheet_id,
                "week_start_date": str(event.week_start_date),
                "employee_code": event.employee_code,
            },
        }
        for approver in approvers
    ]

    bulk_create_notifications(records)


def handle_timesheet_approved(event: TimesheetApprovedEvent) -> None:
    recipient = User.objects.filter(id=event.employee_id, is_active=True).first()
    if not recipient:
        return

    actor = User.objects.filter(id=event.actor_id).first() if event.actor_id else None

    create_notification(
        recipient=recipient,
        actor=actor,
        actor_label=event.actor_label,
        event_type="TIMESHEET_APPROVED",
        category=NotificationCategory.TIMESHEET,
        priority=NotificationPriority.NORMAL,
        title="Timesheet Approved",
        body=f"Your timesheet for week {event.week_start_date} has been approved.",
        action_url=f"/timesheets?week={event.week_start_date}",
        metadata={
            "timesheet_id": event.timesheet_id,
            "week_start_date": str(event.week_start_date),
            "approved_by": event.actor_label,
        },
    )


def handle_timesheet_returned(event: TimesheetReturnedEvent) -> None:
    recipient = User.objects.filter(id=event.employee_id, is_active=True).first()
    if not recipient:
        return

    actor = User.objects.filter(id=event.actor_id).first() if event.actor_id else None

    create_notification(
        recipient=recipient,
        actor=actor,
        actor_label=event.actor_label,
        event_type="TIMESHEET_RETURNED",
        category=NotificationCategory.TIMESHEET,
        priority=NotificationPriority.HIGH,
        title="Timesheet Returned",
        body=f"Your timesheet for week {event.week_start_date} has been returned: {event.reason}",
        action_url=f"/timesheets?week={event.week_start_date}",
        metadata={
            "timesheet_id": event.timesheet_id,
            "week_start_date": str(event.week_start_date),
            "returned_by": event.actor_label,
            "reason": event.reason,
        },
    )


def handle_event(event: Any) -> None:
    if isinstance(event, TimesheetSubmittedEvent):
        handle_timesheet_submitted(event)
    elif isinstance(event, TimesheetApprovedEvent):
        handle_timesheet_approved(event)
    elif isinstance(event, TimesheetReturnedEvent):
        handle_timesheet_returned(event)
