from rest_framework import serializers
from apps.timesheets.models import TimesheetPolicy

class TimesheetPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = TimesheetPolicy
        fields = [
            "standard_start_time",
            "standard_end_time",
            "break_duration_hours",
            "daily_regular_hours",
            "hour_step",
            "overtime_threshold_daily",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]
