import datetime
from decimal import Decimal
from django.db import models
from rest_framework.exceptions import ValidationError
from apps.core.models import TimestampedModel

class TimesheetPolicy(TimestampedModel):
    singleton_id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    standard_start_time = models.TimeField(default=datetime.time(9, 0))
    standard_end_time = models.TimeField(default=datetime.time(18, 0))
    break_duration_hours = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("1.00"))
    daily_regular_hours = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("8.00"))
    hour_step = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("0.25"))
    overtime_threshold_daily = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("8.00"))

    class Meta:
        verbose_name = "Timesheet Policy"
        verbose_name_plural = "Timesheet Policies"

    def clean(self):
        if self.daily_regular_hours <= 0:
            raise ValidationError({"daily_regular_hours": ["Daily regular hours must be positive."]})
        if self.hour_step <= 0 or self.hour_step > 1:
            raise ValidationError({"hour_step": ["Hour step must be between 0.05 and 1.00."]})

    def save(self, *args, **kwargs):
        self.singleton_id = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_current(cls) -> "TimesheetPolicy":
        policy, _ = cls.objects.get_or_create(singleton_id=1)
        return policy
