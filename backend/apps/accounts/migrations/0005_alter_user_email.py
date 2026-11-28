from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_loginattempt_device_id_loginattempt_failure_reason_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="email",
            field=models.EmailField(
                blank=True, db_index=True, max_length=254, null=True, unique=True
            ),
        ),
    ]
