from rest_framework import serializers
from apps.projects.models import Project, ProjectStep, StepStatus

class ProjectStepBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectStep
        fields = ["id", "key", "name", "position", "is_custom", "status"]

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
        return obj.steps.count()

    def get_completed_steps(self, obj):
        return sum(1 for s in obj.steps.all() if s.status == StepStatus.COMPLETED)

    def get_completion_percentage(self, obj):
        return obj.completion_percentage

    def get_current_step(self, obj):
        steps = sorted(obj.steps.all(), key=lambda s: s.position)
        for s in steps:
            if s.status != StepStatus.COMPLETED:
                return {"id": s.id, "key": s.key, "name": s.name, "status": s.status, "position": s.position}
        if steps:
            last = steps[-1]
            return {"id": last.id, "key": last.key, "name": last.name, "status": last.status, "position": last.position}
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
        return {"id": None, "employee_code": obj.created_by_label, "full_name": obj.created_by_label}

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
        return obj.steps.count()

    def get_completed_steps(self, obj):
        return sum(1 for s in obj.steps.all() if s.status == StepStatus.COMPLETED)

class ProjectCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200, required=True)
    client_name = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    description = serializers.CharField(required=False, allow_blank=True, default="")
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
    )

class StepStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=StepStatus.choices, required=True)
    confirm = serializers.BooleanField(required=False, default=False)
