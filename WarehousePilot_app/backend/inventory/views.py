# This file defines views for inventory and order management.

# get_inventory: Fetches inventory data and categorizes items by stock levels.
# delete_inventory_items: Deletes inventory items based on provided item IDs.
# add_inventory_item: Adds a new item to the inventory.
# get_csrf_token: Returns a CSRF token for frontend use.
# InventoryView: Retrieves inventory data via a raw SQL query.
# AssignOrderView: Assigns an order to a staff member by user_id.
# AssignedPicklistView: Fetches picklists assigned to the current user that are in progress.
# PickPicklistItemView: Updates the status of a picklist item to 'picked' by a staff member.

import logging
from django.http import JsonResponse
from django.core.mail import send_mail
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import json
from rest_framework import status
from django.middleware.csrf import get_token
from .models import InventoryPicklist, InventoryPicklistItem, Inventory
from .serializers import OrderSerializer
from auth_app.models import users
from django.utils import timezone


# def send_alert(item):
#     send_mail(
#         'Low Stock Alert',
#         f'The stock for {item["sku_color_id"]} is low. Current quantity: {item["qty"]}.',
#         'wp.notifs@gmail.com',
#         ['warehousepilot2024@gmail.com'],
#         fail_silently=False,
#     )


from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

# Django logger for backend
logger = logging.getLogger('WarehousePilot_app')

def get_inventory(request):
    try:
        inventory_data = Inventory.objects.all().values()
        inventory_list = list(inventory_data)
        low_stock_items = []
        for item in inventory_list:
            qty = item['qty']
            if qty == 0:
                item['status'] = 'Out of Stock'
                #logger.info(f"get_inventory - Item {item['sku_color_id']} is out of stock")
            elif qty < 50:
                item['status'] = 'Low'
                low_stock_items.append(item)
                #logger.info(f"get_inventory - Item {item['sku_color_id']} is in low stock")
                # send_alert(item)
            elif 50 <= qty <= 100:
                item['status'] = 'Moderate'
            else:
                item['status'] = 'High'
        #logger.info("Items from inventory retrieved from database")
        return JsonResponse({"inventory": inventory_list, "low_stock_items": low_stock_items}, safe=False)
    except Exception as e:
        #logger.error("Failed to retrieve items and their status from the inventory (get_inventory)")
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def delete_inventory_items(request):
    try:
        data = json.loads(request.body)
        item_ids = data.get('item_ids', [])
        Inventory.objects.filter(inventory_id__in=item_ids).delete()
        #logger.info("Items %s have been deleted successfully", ','.join([str(x) for x in item_ids]))
        return JsonResponse({"message": "Items deleted successfully"}, status=200)
    except Exception as e:
        #logger.error("Failed to delete items from the inventory (delete_inventory_items)")
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def add_inventory_item(request):
    try:
        data = json.loads(request.body)
        new_item = Inventory.objects.create(
            location=data["location"],
            sku_color_id=data["sku_color_id"],
            qty=data["qty"],
            warehouse_number=data["warehouse_number"],
            amount_needed=data["amount_needed"],
        )
        #logger.info("Item %s have been successfully added to the inventory", data["sku_color_id"])
        return JsonResponse({"message": "Item added successfully", "item": new_item.inventory_id}, status=201)
    except Exception as e:
        #logger.error("Failed to add inventory item: %s (add_inventory_item)", str(e))
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def update_inventory_item(request):
    try:
        data = json.loads(request.body)
        item_id = data.get("inventory_id")
        if not item_id:
            return JsonResponse({"error": "Inventory ID is required"}, status=400)

        item = Inventory.objects.get(inventory_id=item_id)
        item.warehouse_number = data.get("warehouse_number", item.warehouse_number)
        item.sku_color_id = data.get("sku_color_id", item.sku_color_id)
        item.location = data.get("location", item.location)
        item.qty = data.get("qty", item.qty)
        item.amount_needed = data.get("amount_needed", item.amount_needed)
        item.save()

        return JsonResponse({"message": "Item updated successfully"}, status=200)
    except Inventory.DoesNotExist:
        return JsonResponse({"error": "Item not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def get_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})

class InventoryView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Query to fetch inventory data with inventory_id
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT inventory_id, sku_color_id, qty, warehouse_number
                    FROM inventory_inventory
                """)
                result = cursor.fetchall()

            # Process the result and return as JSON
            inventory_data = [{
                "inventory_id": row[0],  # Include inventory_id in the result
                "sku_color_id": row[1],
                "qty": row[2],
                "warehouse_number": row[3],
            } for row in result]
            
            logger.info("Successfully retrieved all items from the inventory")
            return Response(inventory_data)
        except Exception as e:
            logger.error("Failed to retrieve items from the inventory (InventoryView)")
            return Response({"error": str(e)}, status=500)

class AssignOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        #logger.debug(f"[DEBUG] order_id from URL: {order_id}")
        user_id = request.data.get('user_id')
        #logger.debug(f"[DEBUG] user_id from body: {user_id}")
        if not user_id:
            #logger.error("User ID is required to assign order (AssignOrderView)")
            return Response({"detail": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.role not in ['admin', 'manager']:
            #logger.error("Unauthorized user - only staff users can access picklist picking")
            return Response({"error": "Not do not have permission to assign an order."}, status=403)

        try:
            order = InventoryPicklist.objects.get(order_id=str(order_id))
        except InventoryPicklist.DoesNotExist:
            #logger.error("Order could not be found (AssignOrderView)")
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            staff_user = users.objects.get(user_id=user_id, role='staff')
        except users.DoesNotExist:
            #logger.error("Staff user could not be found (AssignOrderView)")
            return Response({"detail": "Staff user not found"}, status=status.HTTP_404_NOT_FOUND)

        order.assigned_employee_id = staff_user
        order.save()

        serializer = OrderSerializer(order)
        logger.info("Employee %s was successfully assigned to order %s", order.assigned_employee_id, order_id)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AssignedPicklistView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            current_user = request.user
            # Find picklists assigned to this user
            assigned_picklists = InventoryPicklist.objects.filter(
                assigned_employee_id=current_user,               
                order_id__status='In Progress'                  
            )

            response_data = []
            for picklist in assigned_picklists:
                order = picklist.order_id  
                response_data.append({
                    "order_id": order.order_id,
                    "due_date": order.due_date,
                    "already_filled": not InventoryPicklistItem.objects.filter(
                        picklist_id=picklist.picklist_id,
                        status=False
                    ).exists(),
                    "assigned_to": picklist.assigned_employee_id.first_name + " " + picklist.assigned_employee_id.last_name if picklist.assigned_employee_id else None
                })

            logger.info("Employee %s was assigned to picklists %s", current_user, ', '.join([str(x.order_id.order_id) for x in assigned_picklists]))
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error("Failed to fetch assigned picklist(s) to an employee (AssignedPicklistView)")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class PickPicklistItemView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, picklist_item_id):
        try:
            item = InventoryPicklistItem.objects.get(picklist_item_id=picklist_item_id)
        except InventoryPicklistItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'qa':
            return Response({"error": "Not allowed. You need to log in as staff."}, status=403)

        manually_picked = request.data.get("manually_picked", False)
        picked_quantity = request.data.get("picked_quantity", 0)

        # Update fields
        item.actual_picked_quantity += int(picked_quantity)
        item.status = True
        item.picked_at = timezone.now()
        item.manually_picked = manually_picked
        item.picked_by = request.user  # Store the user who picked the item
        item.save()

        return Response({"message": "Item picked successfully"}, status=status.HTTP_200_OK)

class RepickPicklistItemView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, picklist_item_id):
        try:
            item = InventoryPicklistItem.objects.get(picklist_item_id=picklist_item_id)
        except InventoryPicklistItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'qa':
            return Response({"error": "Not allowed. You need to log in as staff."}, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get("reason")
        quantity = request.data.get("quantity")
        if not reason or not quantity:
            return Response({"error": "Reason and quantity are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Update fields
        item.repick = True
        item.repick_reason = reason
        item.actual_picked_quantity += int(quantity)
        item.repicked_by = request.user  # Store the user who repicked the item
        item.save()

        return Response({"message": f"Item marked for repick due to {reason} with quantity {quantity}."}, status=status.HTTP_200_OK)