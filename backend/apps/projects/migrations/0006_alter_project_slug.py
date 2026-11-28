from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0005_alter_project_code_alter_project_slug"),
    ]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="slug",
            field=models.SlugField(max_length=100, unique=True),
        ),
    ]
