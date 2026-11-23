from decimal import Decimal
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

class CellUpsertSerializer(serializers.Serializer):
    project_id = serializers.IntegerField(required=True)
    date = serializers.DateField(required=True)
    hours = serializers.DecimalField(
        max_digits=4,
        decimal_places=2,
        required=True,
        min_value=Decimal("0.00"),
        max_value=Decimal("24.00"),
    )
    note = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")

    def validate_hours(self, value):
        policy = TimesheetPolicy.get_current()
        step = policy.hour_step
        if value > 0 and (value % step) != 0:
            raise serializers.ValidationError(f"Hours must be a multiple of {step}.")
        return value

class BulkCellSaveSerializer(serializers.Serializer):
    cells = serializers.ListField(
        child=CellUpsertSerializer(),
        allow_empty=False,
        max_length=100,
    )
