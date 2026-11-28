from rest_framework import serializers

from apps.projects.models import Project, ProjectStep, StepStatus


class ProjectStepBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectStep
        fields = ["id", "key", "name", "position", "is_custom", "status", "skip_reason"]


class ProjectMemberBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="employee.id")
    employee_code = serializers.CharField(source="employee.employee_code")
    full_name = serializers.CharField(source="employee.full_name")


class ProjectListSerializer(serializers.ModelSerializer):
    total_steps = serializers.SerializerMethodField()
    completed_steps = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    current_step = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "code",
            "name",
            "slug",
            "client_name",
            "description",
            "site_country",
            "site_city_or_plant",
            "site_timezone",
            "is_active",
            "status",
            "total_steps",
            "completed_steps",
            "completion_percentage",
            "current_step",
            "member_count",
            "members",
            "created_by_label",
            "created_at",
        ]

    def get_total_steps(self, obj):
        return len(obj.steps.all())

    def get_completed_steps(self, obj):
        return sum(1 for s in obj.steps.all() if s.status == StepStatus.COMPLETED)

    def get_completion_percentage(self, obj):
        return obj.completion_percentage

    def get_current_step(self, obj):
        steps = sorted(obj.steps.all(), key=lambda s: s.position)
        for s in steps:
            if s.status not in [StepStatus.COMPLETED, StepStatus.SKIPPED]:
                return {
                    "id": s.id,
                    "key": s.key,
                    "name": s.name,
                    "status": s.status,
                    "position": s.position,
                }
        if steps:
            last = steps[-1]
            return {
                "id": last.id,
                "key": last.key,
                "name": last.name,
                "status": last.status,
                "position": last.position,
            }
        return None

    def get_member_count(self, obj):
        return obj.assignments.count()

    def get_members(self, obj):
        return [
            {
                "id": a.employee.id,
                "employee_code": a.employee.employee_code,
                "full_name": a.employee.full_name,
            }
            for a in obj.assignments.all()
        ]


class ProjectStepDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectStep
        fields = [
            "id",
            "key",
            "name",
            "position",
            "is_custom",
            "status",
            "confirmed_at",
            "confirmed_by_label",
            "skip_reason",
        ]


class ProjectDetailSerializer(serializers.ModelSerializer):
    creator = serializers.SerializerMethodField()
    steps = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    total_steps = serializers.SerializerMethodField()
    completed_steps = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "code",
            "name",
            "slug",
            "client_name",
            "description",
            "site_country",
            "site_city_or_plant",
            "site_timezone",
            "is_active",
            "status",
            "creator",
            "created_at",
            "completion_percentage",
            "total_steps",
            "completed_steps",
            "steps",
            "members",
        ]

    def get_creator(self, obj):
        if obj.created_by:
            return {
                "id": obj.created_by.id,
                "employee_code": obj.created_by.employee_code,
                "full_name": obj.created_by.full_name,
            }
        return {
            "id": None,
            "employee_code": obj.created_by_label,
            "full_name": obj.created_by_label,
        }

    def get_steps(self, obj):
        ordered_steps = sorted(obj.steps.all(), key=lambda s: s.position)
        return ProjectStepDetailSerializer(ordered_steps, many=True).data

    def get_members(self, obj):
        return [
            {
                "id": a.employee.id,
                "employee_code": a.employee.employee_code,
                "full_name": a.employee.full_name,
                "designation": a.employee.designation,
                "department": a.employee.department,
            }
            for a in obj.assignments.select_related("employee").all()
        ]

    def get_completion_percentage(self, obj):
        return obj.completion_percentage

    def get_total_steps(self, obj):
        return len(obj.steps.all())

    def get_completed_steps(self, obj):
        return sum(1 for s in obj.steps.all() if s.status == StepStatus.COMPLETED)


class ProjectCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200, required=True)
    client_name = serializers.CharField(
        max_length=200, required=False, allow_blank=True, default=""
    )
    description = serializers.CharField(required=False, allow_blank=True, default="")
    site_country = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default="India"
    )
    site_city_or_plant = serializers.CharField(
        max_length=150, required=False, allow_blank=True, default=""
    )
    site_timezone = serializers.CharField(
        max_length=50, required=False, allow_blank=True, default="Asia/Kolkata"
    )
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
    )


class StepStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=StepStatus.choices, required=True)
    confirm = serializers.BooleanField(required=False, default=False)
    skip_reason = serializers.CharField(required=False, allow_blank=True, default="")


class SubStepCreateSerializer(serializers.Serializer):
    after_step_id = serializers.IntegerField(required=True)
    name = serializers.CharField(max_length=200, required=True)

    def validate_name(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Sub-step name cannot be empty.")
        return val


class CustomStepUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200, required=True)

    def validate_name(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Step name cannot be empty.")
        return val


class ProjectMemberAddSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=True)


class ProjectMembersSyncSerializer(serializers.Serializer):
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
    )


class ProjectMemberItemSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="employee.id")
    employee_code = serializers.CharField(source="employee.employee_code")
    full_name = serializers.CharField(source="employee.full_name")
    designation = serializers.CharField(source="employee.designation")
    department = serializers.CharField(source="employee.department")
    assigned_at = serializers.DateTimeField()
