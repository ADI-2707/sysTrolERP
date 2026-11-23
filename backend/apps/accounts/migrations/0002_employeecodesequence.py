from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmployeeCodeSequence',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='employee_code', max_length=50, unique=True)),
                ('last_number', models.PositiveIntegerField(default=0)),
            ],
            options={
                'verbose_name': 'Employee Code Sequence',
                'verbose_name_plural': 'Employee Code Sequences',
            },
        ),
    ]
