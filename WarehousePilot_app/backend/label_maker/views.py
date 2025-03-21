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
            "AREA": getattr(item.area, "area", None),
            "LINEUP_NB": getattr(item.lineup_nb, "lineup_nb", None),
            "MODEL_NB": getattr(item.model_nb, "model_nb", None),
            "MATERIAL_TYPE": getattr(item.material_type, "material_type", None),
            "SKU_COLOR_IMAGE":part.image.url if part.image else None,
            "BARCODE": None,
            # Additional fields to be added: qty per case, case size, SKU_COLOR image, barcode
        }
        logger.info(f"Successfully fetched label data for picklist_item_id: {picklist_item_id}")
        return JsonResponse(label_data, status=200)

    except InventoryPicklistItem.DoesNotExist:
        logger.error(f"Picklist item not found for picklist_item_id: {picklist_item_id}")
        return JsonResponse({"error": "Picklist item not found"}, status=404)
    except Exception as e:
        logger.error(f"Picklist item not found for picklist_item_id: {picklist_item_id}")
        return JsonResponse({"error": str(e)}, status=500)

