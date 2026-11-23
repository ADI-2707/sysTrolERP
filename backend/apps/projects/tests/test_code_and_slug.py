import pytest
from apps.projects.models import Project
from apps.projects.services import generate_next_project_code, generate_unique_project_slug

@pytest.mark.django_db
def test_project_code_generation():
    code1 = generate_next_project_code(year=2026)
    code2 = generate_next_project_code(year=2026)
    code3 = generate_next_project_code(year=2027)

    assert code1 == "PRJ-2026-001"
    assert code2 == "PRJ-2026-002"
    assert code3 == "PRJ-2027-001"

@pytest.mark.django_db
def test_project_slug_generation_uniqueness():
    slug1 = generate_unique_project_slug("Blast Furnace Modernization")
    assert slug1 == "blast-furnace-modernization"

    Project.objects.create(
        code="PRJ-2026-010",
        name="Blast Furnace Modernization",
        slug=slug1,
    )

    slug2 = generate_unique_project_slug("Blast Furnace Modernization")
    assert slug2 == "blast-furnace-modernization-2"

    Project.objects.create(
        code="PRJ-2026-011",
        name="Blast Furnace Modernization",
        slug=slug2,
    )

    slug3 = generate_unique_project_slug("Blast Furnace Modernization")
    assert slug3 == "blast-furnace-modernization-3"
