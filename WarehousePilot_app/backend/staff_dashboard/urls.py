from django.urls import path

from . import views
from .views import StaffManufacturingTasksView
from .views import CompleteManufacturingTask

urlpatterns = [
    path("", views.index, name="index"),
    path('staff_manufacturing_tasks/', StaffManufacturingTasksView.as_view(), name="staff_manufacturing_tasks/"),
    path('complete_task/<int:task_id>/', CompleteManufacturingTask.as_view(), name='complete_task'),
]