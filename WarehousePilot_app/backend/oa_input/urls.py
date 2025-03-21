from django.urls import path
from .views import OAInputView

urlpatterns = [
    path('oa_in/', OAInputView.as_view(), name='oa_in'),
    ]