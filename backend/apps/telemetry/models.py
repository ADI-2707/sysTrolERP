from django.db import models
from django.utils import timezone

class RequestLog(models.Model):
    method = models.CharField(max_length=10)
    route_template = models.CharField(max_length=255, blank=True, db_index=True)
    path = models.CharField(max_length=255, db_index=True)
    status_code = models.PositiveIntegerField(db_index=True)
    duration_ms = models.FloatField()
    actor_label = models.CharField(max_length=150, blank=True, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    response_size_bytes = models.PositiveIntegerField(default=0)
    request_id = models.CharField(max_length=64, blank=True, db_index=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        verbose_name = "Request Log"
        verbose_name_plural = "Request Logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.method} {self.path} {self.status_code} ({self.duration_ms:.1f}ms)"
