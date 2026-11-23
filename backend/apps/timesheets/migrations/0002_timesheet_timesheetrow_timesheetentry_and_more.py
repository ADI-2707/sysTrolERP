import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0001_initial'),
        ('timesheets', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Timesheet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('week_start_date', models.DateField(db_index=True)),
                ('status', models.CharField(choices=[('OPEN', 'Open'), ('SUBMITTED', 'Submitted'), ('APPROVED', 'Approved'), ('RETURNED', 'Returned')], db_index=True, default='OPEN', max_length=20)),
                ('submitted_at', models.DateTimeField(blank=True, null=True)),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('approved_by_label', models.CharField(blank=True, max_length=150)),
                ('returned_at', models.DateTimeField(blank=True, null=True)),
                ('returned_by_label', models.CharField(blank=True, max_length=150)),
                ('return_reason', models.TextField(blank=True, default='')),
                ('approved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_timesheets', to=settings.AUTH_USER_MODEL)),
                ('employee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='timesheets', to=settings.AUTH_USER_MODEL)),
                ('returned_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='returned_timesheets', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Timesheet',
                'verbose_name_plural': 'Timesheets',
                'ordering': ['-week_start_date'],
            },
        ),
        migrations.CreateModel(
            name='TimesheetRow',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('description', models.CharField(blank=True, default='', max_length=255)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='timesheet_rows', to='projects.project')),
                ('timesheet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rows', to='timesheets.timesheet')),
            ],
            options={
                'verbose_name': 'Timesheet Row',
                'verbose_name_plural': 'Timesheet Rows',
                'ordering': ['created_at'],
            },
        ),
        migrations.CreateModel(
            name='TimesheetEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('date', models.DateField(db_index=True)),
                ('hours', models.DecimalField(decimal_places=2, max_digits=4)),
                ('note', models.CharField(blank=True, default='', max_length=500)),
                ('row', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='entries', to='timesheets.timesheetrow')),
            ],
            options={
                'verbose_name': 'Timesheet Entry',
                'verbose_name_plural': 'Timesheet Entries',
                'ordering': ['date'],
            },
        ),
        migrations.AddConstraint(
            model_name='timesheet',
            constraint=models.UniqueConstraint(fields=('employee', 'week_start_date'), name='unique_employee_week'),
        ),
        migrations.AddConstraint(
            model_name='timesheetrow',
            constraint=models.UniqueConstraint(fields=('timesheet', 'project'), name='unique_timesheet_project_row'),
        ),
        migrations.AddConstraint(
            model_name='timesheetentry',
            constraint=models.UniqueConstraint(fields=('row', 'date'), name='unique_row_date_entry'),
        ),
        migrations.AddConstraint(
            model_name='timesheetentry',
            constraint=models.CheckConstraint(condition=models.Q(('hours__gt', 0), ('hours__lte', 24)), name='hours_between_0_and_24'),
        ),
    ]
