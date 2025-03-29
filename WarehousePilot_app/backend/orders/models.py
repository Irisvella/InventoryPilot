from django.db import models
from parts.models import Part

# Create your models here.
class Orders(models.Model):
    order_id = models.IntegerField(primary_key=True)
    estimated_duration = models.IntegerField(null=True)
    status = models.CharField(max_length = 255, null=True, default="Not Started")
    due_date = models.DateField(null=True)
    start_timestamp = models.DateTimeField(null=True, blank=True, default=None)
    end_timestamp = models.DateTimeField(null=True, blank=True, default=None) # date when the order is completed and ready to be shipped (packed completion timestamp)
    ship_date = models.DateField(null=True)   # date when the order is shipped (ship completion date)
    customer_name = models.CharField(max_length = 255, null = True)
    manager_name = models.CharField(max_length = 255, null = True) 
    project_type = models.CharField(max_length = 255, null = True) # WW/WR (wetracks/wetwall), SDR, Pick&Pack 


class OrderPart(models.Model):
    order_part_id = models.AutoField(primary_key = True)
    order_id = models.ForeignKey(Orders, on_delete=models.CASCADE)
    sku_color = models.ForeignKey(Part, on_delete=models.CASCADE)
    qty = models.FloatField()
    status = models.BooleanField(null=True)
    location = models.CharField(max_length = 255, null = True)
    area = models.CharField(max_length = 255, null = True)
    importance = models.CharField(max_length = 255, null = True)
    final_model = models.CharField(max_length = 255, null = True)
    material_type = models.CharField(max_length = 255, null = True)
    department = models.CharField(max_length = 255, null = True)
    lineup_nb = models.CharField(max_length = 255, null = True)
    lineup_name = models.CharField(max_length = 255, null = True)
    packed_timestamp = models.DateTimeField(null=True, blank=True, default=None)
