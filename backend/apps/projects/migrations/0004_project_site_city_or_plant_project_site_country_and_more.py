from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0003_projectstep_skip_reason_alter_projectstep_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="site_city_or_plant",
            field=models.CharField(blank=True, default="", max_length=150),
        ),
        migrations.AddField(
            model_name="project",
            name="site_country",
            field=models.CharField(blank=True, default="India", max_length=100),
        ),
        migrations.AddField(
            model_name="project",
            name="site_timezone",
            field=models.CharField(default="Asia/Kolkata", max_length=50),
        ),
    ]
