from django.shortcuts import render
import json
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import logging
from inventory.models import InventoryPicklistItem
from parts.models import Part 

logger = logging.getLogger("WarehousePilot_app")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_label_data(request, picklist_item_id):
    """
    Return label data for a given picklist_item_id.
    The label includes SKU_COLOR, QTY, ORDER_NUMBER.
    The label will also include qty per case, case size, SKU_COLOR image, barcode. 
    However, these fields are not always present in the current DB. 
    """
    try:
        logger.info(f"Fetching label data for picklist_item_id: {picklist_item_id}")
        item = (
            InventoryPicklistItem.objects
            .select_related('sku_color', 'picklist_id__order_id')
            .get(picklist_item_id=picklist_item_id)
        )
        part = item.sku_color
        
        label_data = {
            "SKU_COLOR": (item.sku_color.sku_color or "").upper(),
            "QTY": item.amount,
            "ORDER_NUMBER": getattr(item.picklist_id.order_id, "order_id", None),
            "QTY_PER_BOX": getattr(part, "qty_per_box", None),
            "CRATE_SIZE": getattr(part, "crate_size", None), # this can somehow return a number or a word... 
            "AREA": item.area,
            "LINEUP_NB": item.lineup_nb,
            "MODEL_NB": item.model_nb,
            "MATERIAL_TYPE": item.material_type,
            "SKU_COLOR_IMAGE":part.image.url if part.image else None,
            "BARCODE": None,
        }
        logger.info(f"Successfully fetched label data for picklist_item_id: {picklist_item_id}")
        return JsonResponse(label_data, status=200)

    except InventoryPicklistItem.DoesNotExist:
        logger.error(f"Picklist item not found for picklist_item_id: {picklist_item_id}")
        return JsonResponse({"error": "Picklist item not found"}, status=404)
    except Exception as e:
        logger.error(f"Picklist item not found for picklist_item_id: {picklist_item_id}")
        return JsonResponse({"error": str(e)}, status=500)

# getting all labels for aggregated view 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_labels_for_order(request, order_id):
    try:
        items = (
            InventoryPicklistItem.objects
            .select_related('sku_color', 'picklist_id__order_id')
            .filter(picklist_id__order_id=order_id)
        )

        labels = []
        total = items.count()

        for index, item in enumerate(items, start=1):
            part = item.sku_color
            labels.append({
                "SKU_COLOR": (part.sku_color or "").upper(),
                "QTY": item.amount,
                "ORDER_NUMBER": item.picklist_id.order_id.order_id,
                "QTY_PER_BOX": getattr(part, "qty_per_box", None),
                "CRATE_SIZE": getattr(part, "crate_size", None),
                "AREA": item.area,
                "LINEUP_NB": item.lineup_nb,
                "MODEL_NB": item.model_nb,
                "MATERIAL_TYPE": item.material_type,
                "SKU_COLOR_IMAGE": part.image.url if part.image else None,
                "BARCODE": None,
                "SEQUENCE": f"{index} of {total}",
            })

        return JsonResponse({"labels": labels}, status=200)

    except Exception as e:
        logger.error(f"❌ Error retrieving labels for order {order_id}: {e}")
        return JsonResponse({"error": str(e)}, status=500)