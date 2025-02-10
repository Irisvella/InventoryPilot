from django.db import models

# Create your models here.
class Part(models.Model):
    sku_color = models.CharField(max_length=255, primary_key=True, default='default')
    sku = models.CharField(null=True, max_length=255)
    old_sku = models.CharField(max_length=255, null=True)
    description = models.TextField(null=True)
    qty_per_box = models.IntegerField(null=True)
    weight = models.FloatField(null=True)
    length = models.IntegerField(null=True)
    lbs1400 = models.FloatField(null=True)
    crate_size = models.CharField(max_length=25,null=True)
    image =  models.ImageField(null=True)
    barcode = models.CharField(null=True, max_length=255, unique=True)
