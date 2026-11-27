import datetime
from dataclasses import dataclass, field
from typing import Any

from django.db import transaction


@dataclass(frozen=True)
class TimesheetSubmittedEvent:
    timesheet_id: int
    employee_id: int
    employee_name: str
    employee_code: str
    week_start_date: datetime.date
    actor_label: str = ""
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class TimesheetApprovedEvent:
    timesheet_id: int
    employee_id: int
    actor_id: int | None
    actor_label: str
    week_start_date: datetime.date
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class TimesheetReturnedEvent:
    timesheet_id: int
    employee_id: int
    actor_id: int | None
    actor_label: str
    week_start_date: datetime.date
    reason: str
    extra: dict[str, Any] = field(default_factory=dict)


def dispatch_event(event: Any) -> None:
    from apps.notifications.handlers import handle_event

    def _execute():
        handle_event(event)

    transaction.on_commit(_execute)
