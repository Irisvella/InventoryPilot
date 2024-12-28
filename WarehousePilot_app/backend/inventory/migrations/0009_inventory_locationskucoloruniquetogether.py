# Generated by Django 5.1.3 on 2024-12-23 20:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0008_inventory_location'),
        ('parts', '0008_alter_part_sku_color'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='inventory',
            constraint=models.UniqueConstraint(fields=('location', 'sku_color'), name='LocationSkuColorUniqueTogether'),
        ),
    ]