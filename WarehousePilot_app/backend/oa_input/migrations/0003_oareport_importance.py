# Generated by Django 5.1.3 on 2025-03-24 00:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('oa_input', '0002_alter_oareport_unique_together'),
    ]

    operations = [
        migrations.AddField(
            model_name='oareport',
            name='importance',
            field=models.CharField(max_length=255, null=True),
        ),
    ]
