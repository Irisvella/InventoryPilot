from django.urls import path
from . import views
from .views import daily_picks_data, daily_picks_details, order_fulfillment_rate, get_warehouse_throughput

urlpatterns = [
    path('order-picking-accuracy/', views.order_picking_accuracy, name='order_picking_accuracy'),
    path('order-picking-daily-stats/', daily_picks_data, name='daily_picks_data'),
    path('order-picking-daily-details/', daily_picks_details, name='daily_picks_details'),
    path('order-fulfillment-rate/', order_fulfillment_rate, name='order_fulfillment_rate'),  # New endpoint
    path('warehouse_throughput/', get_warehouse_throughput, name='get_warehouse_throughput'),
]