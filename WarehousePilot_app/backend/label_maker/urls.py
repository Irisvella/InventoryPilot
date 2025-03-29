from django.urls import path
from .views import get_label_data, get_all_labels_for_order

urlpatterns = [
    path('<int:picklist_item_id>/', get_label_data, name='get_label_data'),
    path('order/<int:order_id>/', get_all_labels_for_order, name='get_all_labels_for_order'),
]