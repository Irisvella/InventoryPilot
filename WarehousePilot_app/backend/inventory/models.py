from django.db import models
from orders.models import Orders
from parts.models import Part
from auth_app.models import users
# Create your models here.

class Inventory(models.Model):
    inventory_id = models.AutoField(primary_key=True)
    location = models.CharField(max_length=255)
    sku_color = models.ForeignKey(Part, on_delete=models.CASCADE)
    qty = models.IntegerField()
    warehouse_number = models.CharField()
    amount_needed = models.IntegerField()
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['location', 'sku_color'], name='LocationSkuColorUniqueTogether')
        ]

class InventoryPicklist(models.Model):
    picklist_id = models.AutoField(primary_key=True)
    order_id = models.ForeignKey(Orders, on_delete=models.CASCADE)
    assigned_employee_id = models.ForeignKey(users, null=True, on_delete=models.SET_NULL)
    status = models.BooleanField()

class InventoryPicklistItem(models.Model):
      picklist_item_id = models.AutoField(primary_key=True)
      picklist_id = models.ForeignKey(InventoryPicklist, on_delete=models.CASCADE)
      location = models.ForeignKey(Inventory, null=True, on_delete=models.SET_NULL)
      sku_color = models.ForeignKey(Part, on_delete=models.CASCADE)
      amount = models.IntegerField()
      status = models.BooleanField() # True if picked, False if not picked
