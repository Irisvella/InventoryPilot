from django.urls import path
from .views import QADashboardView

urlpatterns = [
    path('', QADashboardView.as_view(), name='qa_dashboard'),
]

