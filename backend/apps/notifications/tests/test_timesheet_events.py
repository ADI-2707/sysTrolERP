import datetime

import pytest
import time_machine

from apps.accounts.models import User, UserRole
from apps.notifications.models import Notification, NotificationCategory
from apps.timesheets.models import Timesheet, TimesheetWeekStatus
from apps.timesheets.services import (
    approve_timesheet,
    return_timesheet,
    submit_own_timesheet,
)


@pytest.mark.django_db(transaction=True)
def test_submit_timesheet_notifies_admins():
    with time_machine.travel("2026-11-25 10:00:00+05:30"):
        admin1 = User.objects.create_user(
            employee_code="ADM-001",
            email="admin1@example.com",
            full_name="Admin One",
            role=UserRole.ADMIN,
            password="Password123!",
        )
        admin2 = User.objects.create_user(
            employee_code="ADM-002",
            email="admin2@example.com",
            full_name="Admin Two",
            role=UserRole.ADMIN,
            password="Password123!",
        )
        emp = User.objects.create_user(
            employee_code="EMP-001",
            email="emp1@example.com",
            full_name="John Doe",
            role=UserRole.EMPLOYEE,
            password="Password123!",
        )

        submit_own_timesheet(user=emp, week_date=datetime.date(2026, 11, 23))

        admin1_notifs = Notification.objects.filter(recipient=admin1)
        admin2_notifs = Notification.objects.filter(recipient=admin2)
        emp_notifs = Notification.objects.filter(recipient=emp)

        assert admin1_notifs.count() == 1
        assert admin2_notifs.count() == 1
        assert emp_notifs.count() == 0

        notif = admin1_notifs.first()
        assert notif.event_type == "TIMESHEET_SUBMITTED"
        assert notif.category == NotificationCategory.TIMESHEET
        assert notif.is_read is False
        assert "John Doe" in notif.body
        assert "sent to you to approve" in notif.body
        assert notif.action_url == "/timesheets?week=2026-11-23&employee=EMP-001"


@pytest.mark.django_db(transaction=True)
def test_approve_timesheet_notifies_employee():
    with time_machine.travel("2026-11-25 10:00:00+05:30"):
        admin = User.objects.create_user(
            employee_code="ADM-001",
            email="admin1@example.com",
            full_name="Admin One",
            role=UserRole.ADMIN,
            password="Password123!",
        )
        emp = User.objects.create_user(
            employee_code="EMP-001",
            email="emp1@example.com",
            full_name="Jane Doe",
            role=UserRole.EMPLOYEE,
            password="Password123!",
        )

        timesheet = Timesheet.objects.create(
            employee=emp,
            week_start_date=datetime.date(2026, 11, 23),
            status=TimesheetWeekStatus.SUBMITTED,
        )

        approve_timesheet(timesheet_id=timesheet.id, actor=admin)

        emp_notifs = Notification.objects.filter(recipient=emp)
        assert emp_notifs.count() == 1

        notif = emp_notifs.first()
        assert notif.event_type == "TIMESHEET_APPROVED"
        assert notif.category == NotificationCategory.TIMESHEET
        assert notif.is_read is False
        assert notif.title == "Timesheet Approved"
        assert "Your timesheet for week 2026-11-23 has been approved." in notif.body
        assert notif.action_url == "/timesheets?week=2026-11-23"


@pytest.mark.django_db(transaction=True)
def test_return_timesheet_notifies_employee():
    with time_machine.travel("2026-11-25 10:00:00+05:30"):
        admin = User.objects.create_user(
            employee_code="ADM-001",
            email="admin1@example.com",
            full_name="Admin One",
            role=UserRole.ADMIN,
            password="Password123!",
        )
        emp = User.objects.create_user(
            employee_code="EMP-001",
            email="emp1@example.com",
            full_name="Jane Doe",
            role=UserRole.EMPLOYEE,
            password="Password123!",
        )

        timesheet = Timesheet.objects.create(
            employee=emp,
            week_start_date=datetime.date(2026, 11, 23),
            status=TimesheetWeekStatus.SUBMITTED,
        )

        return_timesheet(
            timesheet_id=timesheet.id,
            reason="Missing Friday hours",
            actor=admin,
        )

        emp_notifs = Notification.objects.filter(recipient=emp)
        assert emp_notifs.count() == 1

        notif = emp_notifs.first()
        assert notif.event_type == "TIMESHEET_RETURNED"
        assert notif.is_read is False
        assert "Missing Friday hours" in notif.body
