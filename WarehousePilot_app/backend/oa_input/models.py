from django.db import models

# Create your models here.
class OAReport(models.Model):
    oa_id = models.AutoField(primary_key=True)
    order_id = models.IntegerField()
    qty = models.IntegerField()
    location = models.CharField(max_length=255, null=True)
    sku_color = models.CharField(max_length=255)
    material_type = models.CharField(max_length=255)
    department = models.CharField(max_length=255)
    lineup_nb = models.CharField(max_length=255)
    lineup_name = models.CharField(max_length=255)
    due_date = models.DateTimeField(null=True)
    client_name = models.CharField(max_length=255)
    project_type = models.CharField(max_length=255)
    area = models.CharField(max_length=255)
    final_model = models.CharField(max_length=255)

    class Meta:
        unique_together = ('order_id', 'sku_color', 'qty', 'lineup_nb', 'due_date','project_type','area', 'final_model')  

    def __str__(self):
        return f"Order {self.order_id} - {self.sku_color}"