# Generated by Django 5.1.3 on 2025-01-14 17:33

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('manufacturingLists', '0005_manufacturingtask'),
    ]

    operations = [
        migrations.AddField(
            model_name='manufacturinglistitem',
            name='manufacturing_task',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='manufacturingLists.manufacturingtask'),
        ),
    ]
