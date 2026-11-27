from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimestampedModel

CORE_STEPS = (
    ("ENQUIRY", "Enquiry"),
    ("SALES_VISIT", "Sales Visit"),
    ("PROCUREMENT", "Procurement"),
    ("ENGINEERING", "Engineering"),
    ("MANUFACTURING", "Manufacturing"),
    ("DISPATCH", "Dispatch"),
    ("ERECTION", "Erection"),
    ("COMMISSIONING", "Commissioning"),
    ("COLD_TRIAL", "Cold Trial"),
    ("HOT_TRIAL", "Hot Trial"),
    ("PERFORMANCE_GUARANTEE_TEST", "Performance Guarantee Test"),
    ("MOM_AND_HANDOVER", "MOM and Handover"),
    ("PAYMENT", "Payment"),
    ("AMC", "AMC"),
)


class StepStatus(models.TextChoices):
    NOT_STARTED = "NOT_STARTED", "Not Started"
    INITIATED = "INITIATED", "Initiated"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    COMPLETED = "COMPLETED", "Completed"
    SKIPPED = "SKIPPED", "Skipped"


STEP_STATUS_ORDER = {
    StepStatus.NOT_STARTED: 0,
    StepStatus.INITIATED: 1,
    StepStatus.IN_PROGRESS: 2,
    StepStatus.COMPLETED: 3,
    StepStatus.SKIPPED: 3,
}


class Project(TimestampedModel):
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, db_index=True)
    client_name = models.CharField(max_length=200, blank=True, default="")
    description = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_projects",
    )
    created_by_label = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Project"
        verbose_name_plural = "Projects"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_active", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    @property
    def status(self) -> str:
        steps = list(self.steps.all())
        total = len(steps)
        if total > 0 and sum(1 for s in steps if s.status in [StepStatus.COMPLETED, StepStatus.SKIPPED]) == total:
            return "COMPLETED"
        return "ACTIVE"

    @property
    def completion_percentage(self) -> float:
        steps = list(self.steps.all())
        total = len(steps)
        if total == 0:
            return 0.0
        active_steps = [s for s in steps if s.status != StepStatus.SKIPPED]
        if not active_steps:
            return 100.0
        completed = sum(1 for s in active_steps if s.status == StepStatus.COMPLETED)
        return round((completed / len(active_steps)) * 100.0, 1)


class ProjectStep(TimestampedModel):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="steps",
    )
    key = models.CharField(max_length=50, blank=True, default="")
    name = models.CharField(max_length=200)
    position = models.PositiveIntegerField(db_index=True)
    is_custom = models.BooleanField(default=False)
    status = models.CharField(
        max_length=30,
        choices=StepStatus.choices,
        default=StepStatus.NOT_STARTED,
    )
    confirmed_at = models.DateTimeField(null=True, blank=True)
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="confirmed_steps",
    )
    confirmed_by_label = models.CharField(max_length=150, blank=True)
    skip_reason = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Project Step"
        verbose_name_plural = "Project Steps"
        ordering = ["position"]
        unique_together = [("project", "position")]

    def __str__(self):
        return f"{self.project.code} Step {self.position}: {self.name} ({self.status})"


class ProjectAssignment(TimestampedModel):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_assignments",
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_memberships",
    )
    assigned_by_label = models.CharField(max_length=150, blank=True)
    assigned_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = "Project Assignment"
        verbose_name_plural = "Project Assignments"
        unique_together = [("project", "employee")]
        ordering = ["-assigned_at"]

    def __str__(self):
        return f"{self.employee.employee_code} -> {self.project.code}"


class ProjectCodeSequence(models.Model):
    year = models.PositiveIntegerField(unique=True)
    last_number = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Project Code Sequence"
        verbose_name_plural = "Project Code Sequences"

    def __str__(self):
        return f"{self.year}: {self.last_number}"
