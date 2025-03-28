from django.urls import path
from .views import GenerateInventoryAndManufacturingListsView

from . import views
from .views import OrdersView, StartOrderView, InventoryPicklistView, InventoryPicklistItemsView, CycleTimePerOrderView, DelayedOrders, CycleTimePerOrderPreview


urlpatterns = [
    path('generateLists/', GenerateInventoryAndManufacturingListsView.as_view(), name="generateLists"),
    path("ordersview/", OrdersView.as_view(), name="ordersview"),
    path('start_order/<int:order_id>/', StartOrderView.as_view(), name='start_order'),
    path('inventory_picklist/', InventoryPicklistView.as_view(), name='inventory_picklist'),
    path('inventory_picklist_items/<int:order_id>/', InventoryPicklistItemsView.as_view(), name='inventory_picklist_items'),
    path('cycle_time_per_order/', CycleTimePerOrderView.as_view(), name='cycle_time_per_order'),
    path('delayed_orders/', DelayedOrders.as_view(), name='delayed_orders'),
    path('ctpo_preview/', CycleTimePerOrderPreview.as_view(), name='ctpo_preview'),
]
