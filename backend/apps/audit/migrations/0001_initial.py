import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('actor_kind', models.CharField(choices=[('SUPER', 'Super Admin'), ('ADMIN', 'Admin'), ('EMPLOYEE', 'Employee'), ('SYSTEM', 'System'), ('ANONYMOUS', 'Anonymous')], default='SYSTEM', max_length=20)),
                ('actor_label', models.CharField(blank=True, max_length=150)),
                ('action', models.CharField(db_index=True, max_length=50)),
                ('entity_type', models.CharField(blank=True, db_index=True, max_length=50)),
                ('entity_id', models.CharField(blank=True, db_index=True, max_length=50)),
                ('summary', models.TextField(blank=True)),
                ('changes', models.JSONField(blank=True, default=dict)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True)),
                ('request_id', models.CharField(blank=True, db_index=True, max_length=64)),
                ('super_only', models.BooleanField(db_index=True, default=False)),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ('actor_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Audit Log',
                'verbose_name_plural': 'Audit Logs',
                'ordering': ['-created_at'],
            },
        ),
    ]
