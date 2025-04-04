# Generated by Django 5.1.3 on 2025-01-19 03:12

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0009_inventory_locationskucoloruniquetogether'),
        ('orders', '0005_orders_start_timestamp'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='inventorypicklist',
            constraint=models.UniqueConstraint(fields=('order_id',), name='unique_order_picklist'),
        ),
    ]
