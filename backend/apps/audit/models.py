from django.conf import settings
from django.db import models
from django.utils import timezone


class ActorKind(models.TextChoices):
    SUPER = "SUPER", "Super Admin"
    ADMIN = "ADMIN", "Admin"
    EMPLOYEE = "EMPLOYEE", "Employee"
    SYSTEM = "SYSTEM", "System"
    ANONYMOUS = "ANONYMOUS", "Anonymous"


class AuditLog(models.Model):
    actor_kind = models.CharField(
        max_length=20,
        choices=ActorKind.choices,
        default=ActorKind.SYSTEM,
    )
    actor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    actor_label = models.CharField(max_length=150, blank=True)
    action = models.CharField(max_length=50, db_index=True)
    entity_type = models.CharField(max_length=50, blank=True, db_index=True)
    entity_id = models.CharField(max_length=50, blank=True, db_index=True)
    summary = models.TextField(blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_id = models.CharField(max_length=64, blank=True, db_index=True)
    super_only = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.created_at}] {self.actor_label} {self.action} on {self.entity_type}:{self.entity_id}"

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise RuntimeError("AuditLog records are append-only and cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise RuntimeError("AuditLog records cannot be individually deleted.")
