from django.db import models
from apps.core.models import TimestampedModel

class SampleConcreteModel(TimestampedModel):
    name = models.CharField(max_length=50)

    class Meta:
        app_label = "core"

def test_timestamped_model_fields():
    field_names = [f.name for f in SampleConcreteModel._meta.fields]
    assert "created_at" in field_names
    assert "updated_at" in field_names
