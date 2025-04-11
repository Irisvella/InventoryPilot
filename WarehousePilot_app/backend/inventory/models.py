from django.db import models
from orders.models import Orders
from parts.models import Part
from auth_app.models import users
from django.utils import timezone
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
    warehouse_nb = models.CharField(max_length=255, null=True) # its going to be 499 for inventory picking and 429 for prod 
    assigned_employee_id = models.ForeignKey(users, null=True, on_delete=models.SET_NULL)
    status = models.BooleanField()
    picklist_complete_timestamp = models.DateTimeField(null=True, blank=True, default=None) # when the picklist has been fully picked
    class Meta:
        constraints = [
        models.UniqueConstraint(fields=['order_id'], name='unique_order_picklist')
        ]

class InventoryPicklistItem(models.Model):
      picklist_item_id = models.AutoField(primary_key=True)
      picklist_id = models.ForeignKey(InventoryPicklist, on_delete=models.CASCADE)
      location = models.ForeignKey(Inventory, null=True, on_delete=models.SET_NULL)
      sku_color = models.ForeignKey(Part, on_delete=models.CASCADE)
      amount = models.IntegerField()
      status = models.BooleanField() # True if picked, False if not picked
      item_picked_timestamp = models.DateTimeField(null=True, blank=True, default=None) # when the item has been picked
      picked_at = models.DateTimeField(null=True, blank=True)
      area = models.CharField(max_length=255, null=True) # area type, like dairy, meat, produce, etc
      lineup_nb = models.CharField(max_length=255, null=True) # lineup number like 01, 02, etc
      model_nb = models.CharField(max_length=255, null=True) # model number like 8-12, 13-15 
      material_type = models.CharField(max_length=255, null=True) # material type (metal and plastic). All metals must be picked before plastics 
      manually_picked = models.BooleanField(default=False)  
      repick = models.BooleanField(default=False)  
      repick_reason = models.TextField(null=True, blank=True)
      actual_picked_quantity = models.IntegerField(default=0)  # New field to store the actual picked amount
      picked_by = models.ForeignKey(users, null=True, blank=True, on_delete=models.SET_NULL, related_name="picked_items")
      repicked_by = models.ForeignKey(users, null=True, blank=True, on_delete=models.SET_NULL, related_name="repicked_items")

def __str__(self):
        return f"Picklist Item {self.picklist_item_id} - Status: {self.status}"
