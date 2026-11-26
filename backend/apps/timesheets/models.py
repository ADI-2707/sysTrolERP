import datetime
from decimal import Decimal

from django.conf import settings
from django.db import models
from rest_framework.exceptions import ValidationError

from apps.core.models import TimestampedModel
from apps.projects.models import Project


class TimesheetPolicy(TimestampedModel):
    singleton_id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    standard_start_time = models.TimeField(default=datetime.time(9, 0))
    standard_end_time = models.TimeField(default=datetime.time(18, 0))
    break_duration_hours = models.DecimalField(
        max_digits=4, decimal_places=2, default=Decimal("1.00")
    )
    daily_regular_hours = models.DecimalField(
        max_digits=4, decimal_places=2, default=Decimal("8.00")
    )
    hour_step = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("0.25"))
    overtime_threshold_daily = models.DecimalField(
        max_digits=4, decimal_places=2, default=Decimal("8.00")
    )

    class Meta:
        verbose_name = "Timesheet Policy"
        verbose_name_plural = "Timesheet Policies"

    def clean(self):
        if self.daily_regular_hours <= 0:
            raise ValidationError(
                {"daily_regular_hours": ["Daily regular hours must be positive."]}
            )
        if self.hour_step <= 0 or self.hour_step > 1:
            raise ValidationError({"hour_step": ["Hour step must be between 0.05 and 1.00."]})

    def save(self, *args, **kwargs):
        self.singleton_id = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_current(cls) -> "TimesheetPolicy":
        policy, _ = cls.objects.get_or_create(singleton_id=1)
        return policy


class TimesheetWeekStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    SUBMITTED = "SUBMITTED", "Submitted"
    APPROVED = "APPROVED", "Approved"
    RETURNED = "RETURNED", "Returned"


class Timesheet(TimestampedModel):
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="timesheets",
    )
    week_start_date = models.DateField(db_index=True)
    status = models.CharField(
        max_length=20,
        choices=TimesheetWeekStatus.choices,
        default=TimesheetWeekStatus.OPEN,
        db_index=True,
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_timesheets",
    )
    approved_by_label = models.CharField(max_length=150, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    returned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="returned_timesheets",
    )
    returned_by_label = models.CharField(max_length=150, blank=True)
    return_reason = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Timesheet"
        verbose_name_plural = "Timesheets"
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "week_start_date"],
                name="unique_employee_week",
            ),
        ]
        ordering = ["-week_start_date"]

    def __str__(self):
        return f"{self.employee.employee_code} - Week {self.week_start_date} ({self.status})"


class TimesheetRow(TimestampedModel):
    timesheet = models.ForeignKey(
        Timesheet,
        on_delete=models.CASCADE,
        related_name="rows",
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="timesheet_rows",
    )
    description = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        verbose_name = "Timesheet Row"
        verbose_name_plural = "Timesheet Rows"
        constraints = [
            models.UniqueConstraint(
                fields=["timesheet", "project"],
                name="unique_timesheet_project_row",
            ),
        ]
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.timesheet} -> {self.project.code}"


class TimesheetEntry(TimestampedModel):
    row = models.ForeignKey(
        TimesheetRow,
        on_delete=models.CASCADE,
        related_name="entries",
    )
    date = models.DateField(db_index=True)
    hours = models.DecimalField(max_digits=4, decimal_places=2)
    note = models.CharField(max_length=500, blank=True, default="")

    class Meta:
        verbose_name = "Timesheet Entry"
        verbose_name_plural = "Timesheet Entries"
        constraints = [
            models.UniqueConstraint(
                fields=["row", "date"],
                name="unique_row_date_entry",
            ),
            models.CheckConstraint(
                condition=models.Q(hours__gte=0) & models.Q(hours__lte=24),
                name="hours_between_0_and_24",
            ),
        ]
        ordering = ["date"]

    def __str__(self):
        return f"{self.row.project.code} {self.date}: {self.hours}h"
