from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from apps.projects.models import Project, ProjectCodeSequence

def generate_next_project_code(year: int | None = None) -> str:
    if year is None:
        year = timezone.now().year

    with transaction.atomic():
        seq, _ = ProjectCodeSequence.objects.select_for_update().get_or_create(
            year=year,
            defaults={"last_number": 0},
        )
        seq.last_number += 1
        seq.save(update_fields=["last_number"])
        return f"PRJ-{year}-{seq.last_number:03d}"

def generate_unique_project_slug(name: str) -> str:
    base_slug = slugify(name)
    if not base_slug:
        base_slug = "project"

    slug = base_slug
    counter = 1
    while Project.objects.filter(slug=slug).exists():
        counter += 1
        slug = f"{base_slug}-{counter}"

    return slug
