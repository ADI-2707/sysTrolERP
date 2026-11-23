import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('telemetry', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ErrorLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('error_class', models.CharField(db_index=True, max_length=150)),
                ('message', models.TextField()),
                ('trace', models.TextField(blank=True)),
                ('request_id', models.CharField(blank=True, db_index=True, max_length=64)),
                ('path', models.CharField(blank=True, db_index=True, max_length=255)),
                ('method', models.CharField(blank=True, max_length=10)),
                ('actor_label', models.CharField(blank=True, max_length=150)),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
            ],
            options={
                'verbose_name': 'Error Log',
                'verbose_name_plural': 'Error Logs',
                'ordering': ['-created_at'],
            },
        ),
    ]
