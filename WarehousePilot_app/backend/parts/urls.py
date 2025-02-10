from django.urls import path
from .views import VerifyBarcode
from . import views

urlpatterns = [
    path('scan-barcode/', VerifyBarcode.as_view(), name='verify_barcode'),
]