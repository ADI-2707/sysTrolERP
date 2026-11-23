import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_employeecodesequence'),
    ]

    operations = [
        migrations.CreateModel(
            name='LoginAttempt',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('identifier', models.CharField(db_index=True, max_length=255)),
                ('ip_address', models.GenericIPAddressField(db_index=True)),
                ('attempted_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ('successful', models.BooleanField(default=False)),
            ],
            options={
                'verbose_name': 'Login Attempt',
                'verbose_name_plural': 'Login Attempts',
                'ordering': ['-attempted_at'],
            },
        ),
    ]
