from django.db import models
from parts.models import Part

# Create your models here.
class Orders(models.Model):
    order_id = models.IntegerField(primary_key=True)
    estimated_duration = models.IntegerField(null=True)
    status = models.CharField(max_length = 255, null=True, default="Not Started")
    due_date = models.DateField(null=True)
    start_timestamp = models.DateTimeField(null=True, blank=True, default=None)

class OrderPart(models.Model):
    order_part_id = models.AutoField(primary_key = True)
    order_id = models.ForeignKey(Orders, on_delete=models.CASCADE)
    sku_color = models.ForeignKey(Part, on_delete=models.CASCADE)
    qty = models.FloatField()
    status = models.BooleanField(null=True)