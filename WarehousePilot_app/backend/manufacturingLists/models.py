from django.db import models
from parts.models import Part
from orders.models import Orders
from auth_app.models import users
from django.conf import settings
# Create your models here.

class ManufacturingLists(models.Model):
    manufacturing_list_id = models.AutoField(primary_key=True)
    order_id = models.ForeignKey(Orders, on_delete=models.CASCADE)
    status = models.CharField(max_length=255)

class ManufacturingTask(models.Model):
    '''
    The production steps in order are:
    1. nesting/punching
    2. bending/pliage
    3. cutting
    4. welding (optional)
    5. production qa
    6. painting
    7. painting qa
    8. completed (send to pick and pack)
    '''
    
    MANUFACTURING_PROCESSES={
        "nesting" : "nesting", # also called punching
        "bending" : "bending", # also called pliage
        "cutting" :  "cutting", 
        "welding" : "welding", # optional step 
        "painting" : "painting",
        "production_qa" : "production_qa",
        "painting_qa" : "painting_qa",
        "completed" : "completed"
    }
    manufacturing_task_id = models.AutoField(primary_key=True)
    sku_color = models.ForeignKey(Part, on_delete=models.CASCADE)
    qty = models.IntegerField()
    due_date = models.DateField()
    status = models.CharField(max_length=25, choices=MANUFACTURING_PROCESSES)
    
    nesting_start_time = models.DateTimeField(null=True)
    nesting_end_time = models.DateTimeField(null=True)
    bending_start_time = models.DateTimeField(null=True)
    bending_end_time = models.DateTimeField(null=True)
    cutting_start_time = models.DateTimeField(null=True)
    cutting_end_time = models.DateTimeField(null=True)
    welding_start_time = models.DateTimeField(null=True)
    welding_end_time = models.DateTimeField(null=True)
    paint_start_time = models.DateTimeField(null=True)
    paint_end_time = models.DateTimeField(null=True)
    
    prod_qa = models.BooleanField(default=False)
    paint_qa = models.BooleanField(default=False)
    
    nesting_employee = models.ForeignKey(users, null=True, on_delete=models.SET_NULL, related_name="cut_employee", related_query_name="cut_employee")
    prod_qa_employee = models.ForeignKey(users, null=True, on_delete=models.SET_NULL, related_name="cut_qa_employee", related_query_name="cut_qa_employee")
    bending_employee = models.ForeignKey(users, null=True, on_delete=models.SET_NULL, related_name="bend_employee", related_query_name="bend_employee")
    cutting_employee = models.ForeignKey(users, null=True, on_delete=models.SET_NULL, related_name="bend_qa_employee", related_query_name="bend_qa_employee")
    welding_employee = models.ForeignKey(users, null=True, on_delete=models.SET_NULL, related_name="weld_employee", related_query_name="weld_employee")
    paint_employee = models.ForeignKey(users, null=True, on_delete=models.SET_NULL, related_name="paint_employee", related_query_name="paint_employee")
    paint_qa_employee = models.ForeignKey(users, null=True, on_delete=models.SET_NULL, related_name="paint_qa_employee", related_query_name="paint_qa_employee")
    
class ManufacturingListItem(models.Model):
    MANUFACTURING_PROCESSES={
        "nesting" : "nesting",
        "bending" : "bending",
        "cutting" :  "cutting",
        "welding" : "welding",
        "painting" :  "painting",
        "completed" : "completed",
        "production QA": "production QA",
        "painting QA" :  "painting QA"
    }
    PROGRESS_STAGES={
        "To Do" : "To Do",
        "In Progress" : "In Progress",
        "Completed" : "Completed"
    }
    manufacturing_list_item_id = models.AutoField(primary_key=True)
    manufacturing_list_id = models.ForeignKey(ManufacturingLists, on_delete=models.CASCADE)
    sku_color = models.ForeignKey(Part, on_delete=models.CASCADE)
    amount = models.IntegerField()
    manufacturing_process=models.CharField(null=True, max_length=25, choices=MANUFACTURING_PROCESSES)
    process_progress = models.CharField(null=True, max_length=25, choices=PROGRESS_STAGES)
    manufacturing_task = models.ForeignKey(ManufacturingTask, null=True, on_delete=models.SET_NULL)

class QAErrorReport(models.Model):
    """
    Stores detailed QA error reports. Multiple reports can be linked to a single task.
    """
    id = models.AutoField(primary_key=True)
    manufacturing_task = models.ForeignKey(
        ManufacturingTask,
        on_delete=models.CASCADE,
        related_name='error_reports'
    )
    subject = models.CharField(max_length=255, null=True, blank=True)
    comment = models.TextField(null=True, blank=True)
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"QAErrorReport #{self.id} (Task {self.manufacturing_task.manufacturing_task_id})"
    