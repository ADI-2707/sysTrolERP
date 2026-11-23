import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='RequestLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('method', models.CharField(max_length=10)),
                ('route_template', models.CharField(blank=True, db_index=True, max_length=255)),
                ('path', models.CharField(db_index=True, max_length=255)),
                ('status_code', models.PositiveIntegerField(db_index=True)),
                ('duration_ms', models.FloatField()),
                ('actor_label', models.CharField(blank=True, db_index=True, max_length=150)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('response_size_bytes', models.PositiveIntegerField(default=0)),
                ('request_id', models.CharField(blank=True, db_index=True, max_length=64)),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
            ],
            options={
                'verbose_name': 'Request Log',
                'verbose_name_plural': 'Request Logs',
                'ordering': ['-created_at'],
            },
        ),
    ]
