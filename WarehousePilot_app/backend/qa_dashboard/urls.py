from django.urls import path
from .views import QADashboardView, QAManufacturingTasksView, UpdateQATaskView, ReportQAErrorView

urlpatterns = [
    path('', QADashboardView.as_view(), name='qa_dashboard'),
    path('qa_tasks/', QAManufacturingTasksView.as_view(), name='qa_tasks'),
    path('qa_tasks/update/', UpdateQATaskView.as_view(), name='update_qa_task'),
    path('qa_tasks/report_error/', ReportQAErrorView.as_view(), name='report_qa_error'),
]
