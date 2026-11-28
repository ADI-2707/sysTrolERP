from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0004_project_site_city_or_plant_project_site_country_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="code",
            field=models.CharField(db_index=True, max_length=15, unique=True),
        ),
        migrations.AlterField(
            model_name="project",
            name="slug",
            field=models.SlugField(max_length=15, unique=True),
        ),
    ]
