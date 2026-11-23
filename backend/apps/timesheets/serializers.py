import datetime
from decimal import Decimal
from rest_framework import serializers
from apps.accounts.principals import SuperAdminPrincipal
from apps.timesheets.models import Timesheet, TimesheetPolicy, TimesheetWeekStatus

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

class TimesheetRowCreateSerializer(serializers.Serializer):
    project_id = serializers.IntegerField(required=True)
    week = serializers.DateField(required=False, default=None)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")

class TimesheetSubmitSerializer(serializers.Serializer):
    week = serializers.DateField(required=False, default=None)

class TimesheetAdminListSerializer(serializers.ModelSerializer):
    employee = serializers.SerializerMethodField()
    week_end_date = serializers.SerializerMethodField()
    total_hours = serializers.SerializerMethodField()
    can_approve = serializers.SerializerMethodField()

    class Meta:
        model = Timesheet
        fields = [
            "id",
            "employee",
            "week_start_date",
            "week_end_date",
            "status",
            "total_hours",
            "submitted_at",
            "approved_at",
            "approved_by_label",
            "returned_at",
            "returned_by_label",
            "return_reason",
            "can_approve",
        ]

    def get_employee(self, obj):
        return {
            "id": obj.employee.id,
            "code": obj.employee.employee_code,
            "name": obj.employee.full_name,
            "designation": obj.employee.designation,
            "department": obj.employee.department,
        }

    def get_week_end_date(self, obj):
        return (obj.week_start_date + datetime.timedelta(days=6)).isoformat()

    def get_total_hours(self, obj):
        total = Decimal("0.00")
        for row in obj.rows.all():
            for entry in row.entries.all():
                total += entry.hours
        return str(total)

    def get_can_approve(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        if not user or obj.status != TimesheetWeekStatus.SUBMITTED:
            return False
        if isinstance(user, SuperAdminPrincipal) or getattr(user, "role", None) == "SUPER":
            return True
        return user.id != obj.employee_id
