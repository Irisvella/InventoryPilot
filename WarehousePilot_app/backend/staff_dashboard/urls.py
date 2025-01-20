from django.urls import path

from . import views
from .views import StaffManufacturingTasksView

urlpatterns = [
    path("", views.index, name="index"),
    path('staff_manufacturing_tasks/', StaffManufacturingTasksView.as_view(), name="staff_manufacturing_tasks/"),
    
]