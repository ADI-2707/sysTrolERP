import datetime
from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='TimesheetPolicy',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('singleton_id', models.PositiveSmallIntegerField(default=1, editable=False, primary_key=True, serialize=False)),
                ('standard_start_time', models.TimeField(default=datetime.time(9, 0))),
                ('standard_end_time', models.TimeField(default=datetime.time(18, 0))),
                ('break_duration_hours', models.DecimalField(decimal_places=2, default=Decimal('1.00'), max_digits=4)),
                ('daily_regular_hours', models.DecimalField(decimal_places=2, default=Decimal('8.00'), max_digits=4)),
                ('hour_step', models.DecimalField(decimal_places=2, default=Decimal('0.25'), max_digits=4)),
                ('overtime_threshold_daily', models.DecimalField(decimal_places=2, default=Decimal('8.00'), max_digits=4)),
            ],
            options={
                'verbose_name': 'Timesheet Policy',
                'verbose_name_plural': 'Timesheet Policies',
            },
        ),
    ]
